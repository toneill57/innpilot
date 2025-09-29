-- ENHANCE SEARCH FUNCTIONS - PREVENTING "PRICING BUG" FOR OTHER FIELDS
-- This migration adds all missing fields to search results to ensure 100% coherence

-- Drop and recreate match_optimized_documents with enhanced field inclusion
DROP FUNCTION IF EXISTS match_optimized_documents(vector, double precision, integer, integer, varchar);

CREATE OR REPLACE FUNCTION match_optimized_documents(
  query_embedding vector,
  match_threshold double precision DEFAULT 0.8,
  match_count integer DEFAULT 10,
  tier integer DEFAULT 0,
  tenant_id_filter varchar DEFAULT NULL
)
RETURNS TABLE (
  content text,
  similarity double precision,
  source_table text,
  metadata jsonb,
  tier_name text
)
LANGUAGE plpgsql
AS $$
DECLARE
  embedding_size int;
  actual_tier integer;
  tier_name text;
BEGIN
  -- Get vector dimension using pgvector's dim() function
  embedding_size := vector_dims(query_embedding);

  -- Determine tier to use
  IF tier != 0 THEN
    actual_tier := tier;
    CASE actual_tier
      WHEN 1 THEN tier_name := 'fast';
      WHEN 2 THEN tier_name := 'balanced';
      ELSE tier_name := 'full';
    END CASE;
  ELSE
    -- Auto-detect tier based on embedding dimensions
    CASE
      WHEN embedding_size = 1024 THEN
        actual_tier := 1;
        tier_name := 'fast';
      WHEN embedding_size = 1536 THEN
        actual_tier := 2;
        tier_name := 'balanced';
      WHEN embedding_size = 3072 THEN
        actual_tier := 3;
        tier_name := 'full';
      ELSE
        actual_tier := 2; -- Default fallback
        tier_name := 'balanced';
    END CASE;
  END IF;

  -- If tenant_id_filter is provided, search hotels schema (business listings)
  IF tenant_id_filter IS NOT NULL AND trim(tenant_id_filter) != '' THEN
    -- Search hotel content directly with proper tenant filtering
    RETURN QUERY
    WITH hotel_results AS (
      -- Search accommodation_units WITH ENHANCED CONTENT INCLUDING ALL FIELDS
      SELECT
        CONCAT(
          COALESCE(au.description, au.full_description, au.short_description, au.name, au.unit_number),

          -- PRICING SECTION (already working)
          CASE WHEN au.base_price_low_season IS NOT NULL THEN
            E'\n\nTARIFAS:\n' ||
            'Temporada Baja: $' || au.base_price_low_season || ' COP (2 personas)' ||
            CASE WHEN au.price_per_person_low IS NOT NULL THEN
              ', $' || (au.base_price_low_season + au.price_per_person_low) || ' COP (3 personas), ' ||
              '$' || (au.base_price_low_season + 2*au.price_per_person_low) || ' COP (4 personas)'
            ELSE '' END ||
            E'\nTemporada Alta: $' || COALESCE(au.base_price_high_season::text, 'N/A') || ' COP (2 personas)' ||
            CASE WHEN au.price_per_person_high IS NOT NULL THEN
              ', $' || (au.base_price_high_season + au.price_per_person_high) || ' COP (3 personas), ' ||
              '$' || (au.base_price_high_season + 2*au.price_per_person_high) || ' COP (4 personas)'
            ELSE '' END
          ELSE '' END,

          -- AMENITIES SECTION (already working)
          CASE WHEN au.amenities_list IS NOT NULL AND jsonb_array_length(au.amenities_list) > 0 THEN
            E'\n\nAMENIDADES: ' || array_to_string(ARRAY(SELECT jsonb_array_elements_text(au.amenities_list)), ', ')
          ELSE '' END,

          -- BOOKING POLICIES (already working)
          CASE WHEN au.booking_policies IS NOT NULL THEN
            E'\n\nPOLÍTICAS: ' || au.booking_policies
          ELSE '' END,

          -- NEW FIELDS - PREVENTING "PRICING BUG" FOR OTHER FIELDS

          -- CAPACITY INFORMATION
          CASE WHEN au.capacity IS NOT NULL THEN
            E'\n\nCAPACIDAD: ' ||
            CASE WHEN au.capacity->>'max_capacity' IS NOT NULL
                 THEN 'Máximo ' || (au.capacity->>'max_capacity') || ' personas'
                 ELSE 'Capacidad disponible' END
          ELSE '' END,

          -- BED CONFIGURATION
          CASE WHEN au.bed_configuration IS NOT NULL THEN
            E'\n\nCONFIGURACIÓN DE CAMAS: ' || au.bed_configuration::text
          ELSE '' END,

          -- UNIQUE FEATURES
          CASE WHEN au.unique_features IS NOT NULL AND jsonb_array_length(au.unique_features) > 0 THEN
            E'\n\nCARACTERÍSTICAS ESPECIALES: ' ||
            array_to_string(ARRAY(SELECT jsonb_array_elements_text(au.unique_features)), ', ')
          ELSE '' END,

          -- ACCESSIBILITY FEATURES
          CASE WHEN au.accessibility_features IS NOT NULL AND jsonb_array_length(au.accessibility_features) > 0 THEN
            E'\n\nACCESIBILIDAD: ' ||
            array_to_string(ARRAY(SELECT jsonb_array_elements_text(au.accessibility_features)), ', ')
          ELSE '' END,

          -- LOCATION DETAILS
          CASE WHEN au.location_details IS NOT NULL THEN
            E'\n\nUBICACIÓN: ' ||
            CASE WHEN au.location_details->>'address' IS NOT NULL
                 THEN au.location_details->>'address'
                 ELSE au.location_details::text END
          ELSE '' END,

          -- TOURISM FEATURES
          CASE WHEN au.tourism_features IS NOT NULL THEN
            E'\n\nATRACTIVOS TURÍSTICOS: ' || au.tourism_features
          ELSE '' END,

          -- IMAGES INFORMATION
          CASE WHEN au.images IS NOT NULL THEN
            E'\n\nIMÁGENES: Galería disponible'
          ELSE '' END

        ) as content,
        CASE
          WHEN actual_tier = 1 AND au.embedding_fast IS NOT NULL THEN
            1 - (au.embedding_fast <=> query_embedding::vector(1024))
          WHEN actual_tier = 2 AND au.embedding_balanced IS NOT NULL THEN
            1 - (au.embedding_balanced <=> query_embedding::vector(1536))
          ELSE 0.0
        END as similarity,
        'accommodation_units'::text as source_table,
        jsonb_build_object(
          'id', au.id,
          'name', au.name,
          'unit_number', au.unit_number,
          'capacity', au.capacity,
          'view_type', au.view_type,
          'tenant_id', au.tenant_id,
          'accommodation_type_id', au.accommodation_type_id,
          'business_type', 'hotel',

          -- ENHANCED METADATA - ALL FIELDS INCLUDED
          'pricing', CASE WHEN au.base_price_low_season IS NOT NULL THEN
            jsonb_build_object(
              'base_price_low_season', au.base_price_low_season,
              'base_price_high_season', au.base_price_high_season,
              'price_per_person_low', au.price_per_person_low,
              'price_per_person_high', au.price_per_person_high
            )
          ELSE NULL END,
          'amenities', CASE WHEN au.amenities_list IS NOT NULL THEN au.amenities_list ELSE '[]'::jsonb END,
          'booking_policies', au.booking_policies,
          'unique_features', au.unique_features,
          'accessibility_features', au.accessibility_features,
          'location_details', au.location_details,
          'tourism_features', au.tourism_features,
          'bed_configuration', au.bed_configuration,
          'images', au.images,
          'short_description', au.short_description,
          'full_description', au.full_description
        ) as metadata,
        tier_name
      FROM hotels.accommodation_units au
      WHERE au.tenant_id = tenant_id_filter
        AND (
          (actual_tier = 1 AND au.embedding_fast IS NOT NULL) OR
          (actual_tier = 2 AND au.embedding_balanced IS NOT NULL)
        )

      UNION ALL

      -- Search guest_information (Tier 2 only) WITH ENHANCED CONTENT
      SELECT
        CONCAT(
          gi.info_content,
          CASE WHEN gi.info_type IS NOT NULL THEN
            E'\n\nTIPO: ' || gi.info_type
          ELSE '' END,
          CASE WHEN gi.info_title IS NOT NULL THEN
            E'\n\nTÍTULO: ' || gi.info_title
          ELSE '' END
        ) as content,
        CASE
          WHEN actual_tier >= 2 AND gi.embedding_balanced IS NOT NULL THEN
            1 - (gi.embedding_balanced <=> query_embedding::vector(1536))
          ELSE 0.0
        END as similarity,
        'guest_information'::text as source_table,
        jsonb_build_object(
          'id', gi.info_id,
          'info_type', gi.info_type,
          'info_title', gi.info_title,
          'tenant_id', gi.tenant_id,
          'property_id', gi.property_id,
          'business_type', 'hotel',
          'step_order', gi.step_order,
          'info_content', gi.info_content
        ) as metadata,
        tier_name
      FROM hotels.guest_information gi
      WHERE gi.tenant_id = tenant_id_filter
        AND gi.is_active = true
        AND gi.embedding_balanced IS NOT NULL
        AND actual_tier >= 2

      UNION ALL

      -- Search content table (Tier 2 only) WITH ENHANCED CONTENT
      SELECT
        CONCAT(
          c.content,
          CASE WHEN c.source_type IS NOT NULL THEN
            E'\n\nTIPO: ' || c.source_type
          ELSE '' END
        ) as content,
        CASE
          WHEN actual_tier >= 2 AND c.embedding_balanced IS NOT NULL THEN
            1 - (c.embedding_balanced <=> query_embedding::vector(1536))
          ELSE 0.0
        END as similarity,
        'content'::text as source_table,
        jsonb_build_object(
          'id', c.embedding_id,
          'source_type', c.source_type,
          'source_id', c.source_id,
          'tenant_id', c.tenant_id,
          'business_type', 'hotel',
          'metadata', c.metadata,
          'content', c.content
        ) as metadata,
        tier_name
      FROM hotels.content c
      WHERE c.tenant_id = tenant_id_filter
        AND c.embedding_balanced IS NOT NULL
        AND actual_tier >= 2

      UNION ALL

      -- Search policies (Tier 1 only) WITH ENHANCED CONTENT
      SELECT
        CONCAT(
          p.policy_content,
          CASE WHEN p.policy_type IS NOT NULL THEN
            E'\n\nTIPO DE POLÍTICA: ' || p.policy_type
          ELSE '' END,
          CASE WHEN p.policy_title IS NOT NULL THEN
            E'\n\nTÍTULO: ' || p.policy_title
          ELSE '' END
        ) as content,
        CASE
          WHEN actual_tier = 1 AND p.embedding_fast IS NOT NULL THEN
            1 - (p.embedding_fast <=> query_embedding::vector(1024))
          ELSE 0.0
        END as similarity,
        'policies'::text as source_table,
        jsonb_build_object(
          'id', p.policy_id,
          'policy_type', p.policy_type,
          'policy_title', p.policy_title,
          'tenant_id', p.tenant_id,
          'property_id', p.property_id,
          'business_type', 'hotel',
          'policy_content', p.policy_content
        ) as metadata,
        tier_name
      FROM hotels.policies p
      WHERE p.tenant_id = tenant_id_filter
        AND p.is_active = true
        AND p.embedding_fast IS NOT NULL
        AND actual_tier = 1
    )
    SELECT
      hr.content,
      hr.similarity,
      hr.source_table,
      hr.metadata,
      hr.tier_name
    FROM hotel_results hr
    WHERE hr.similarity > match_threshold
      AND hr.content IS NOT NULL
      AND length(trim(hr.content)) > 0
    ORDER BY hr.similarity DESC
    LIMIT match_count;

  ELSE
    -- Search only public schema content (SIRE/MUVA) when no tenant filter
    IF actual_tier = 1 THEN
      -- Tier 1: Fast searches - MUVA tourism content
      RETURN QUERY
      SELECT
        mc.content,
        1 - (mc.embedding_fast <=> query_embedding::vector(1024)) as similarity,
        'muva_content'::text,
        jsonb_build_object(
          'id', mc.id,
          'title', mc.title,
          'category', mc.category,
          'document_type', mc.document_type,
          'source_file', mc.source_file
        ) as metadata,
        tier_name
      FROM public.muva_content mc
      WHERE mc.embedding_fast IS NOT NULL
        AND 1 - (mc.embedding_fast <=> query_embedding::vector(1024)) > match_threshold
      ORDER BY similarity DESC
      LIMIT match_count;

    ELSIF actual_tier = 2 THEN
      -- Tier 2: Balanced searches - SIRE compliance content
      RETURN QUERY
      SELECT
        sc.content,
        1 - (sc.embedding_balanced <=> query_embedding::vector(1536)) as similarity,
        'sire_content'::text,
        jsonb_build_object(
          'id', sc.id,
          'title', sc.title,
          'category', sc.category,
          'document_type', sc.document_type,
          'source_file', sc.source_file
        ) as metadata,
        tier_name
      FROM public.sire_content sc
      WHERE sc.embedding_balanced IS NOT NULL
        AND 1 - (sc.embedding_balanced <=> query_embedding::vector(1536)) > match_threshold
      ORDER BY similarity DESC
      LIMIT match_count;

    ELSE
      -- Tier 3: Full precision searches - SIRE content fallback
      RETURN QUERY
      SELECT
        sc.content,
        1 - (sc.embedding <=> query_embedding::vector(3072)) as similarity,
        'sire_content'::text,
        jsonb_build_object(
          'id', sc.id,
          'title', sc.title,
          'category', sc.category,
          'document_type', sc.document_type,
          'source_file', sc.source_file
        ) as metadata,
        tier_name
      FROM public.sire_content sc
      WHERE sc.embedding IS NOT NULL
        AND 1 - (sc.embedding <=> query_embedding::vector(3072)) > match_threshold
      ORDER BY similarity DESC
      LIMIT match_count;
    END IF;
  END IF;
END;
$$;