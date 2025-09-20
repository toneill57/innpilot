-- Create pgvector search function for MUVA tourism content
-- Optimized for tourism-specific queries and filtering

CREATE OR REPLACE FUNCTION match_muva_documents(
  query_embedding vector(3072),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 6,
  filter_category text DEFAULT NULL,
  filter_location text DEFAULT NULL,
  filter_city text DEFAULT NULL,
  min_rating float DEFAULT NULL
)
RETURNS TABLE (
  id text,
  content text,
  embedding vector(3072),
  title text,
  description text,
  category text,
  location text,
  city text,
  coordinates point,
  rating decimal,
  price_range text,
  source_file text,
  chunk_index int,
  total_chunks int,
  opening_hours text,
  contact_info jsonb,
  tags text[],
  language text,
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    me.id,
    me.content,
    me.embedding,
    me.title,
    me.description,
    me.category,
    me.location,
    me.city,
    me.coordinates,
    me.rating,
    me.price_range,
    me.source_file,
    me.chunk_index,
    me.total_chunks,
    me.opening_hours,
    me.contact_info,
    me.tags,
    me.language,
    me.created_at,
    me.updated_at,
    1 - (me.embedding <=> query_embedding) as similarity
  FROM muva_embeddings me
  WHERE
    1 - (me.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR me.category = filter_category)
    AND (filter_location IS NULL OR me.location ILIKE '%' || filter_location || '%')
    AND (filter_city IS NULL OR me.city ILIKE '%' || filter_city || '%')
    AND (min_rating IS NULL OR me.rating >= min_rating)
    AND me.embedding IS NOT NULL
  ORDER BY me.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION match_muva_documents TO anon;
GRANT EXECUTE ON FUNCTION match_muva_documents TO authenticated;
GRANT EXECUTE ON FUNCTION match_muva_documents TO service_role;

-- Create helper function for category-specific searches
CREATE OR REPLACE FUNCTION search_muva_restaurants(
  query_embedding vector(3072),
  location_filter text DEFAULT NULL,
  min_rating float DEFAULT NULL,
  price_filter text DEFAULT NULL,
  match_count int DEFAULT 4
)
RETURNS TABLE (
  id text,
  title text,
  description text,
  location text,
  rating decimal,
  price_range text,
  opening_hours text,
  contact_info jsonb,
  similarity float
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    md.id,
    md.title,
    md.description,
    md.location,
    md.rating,
    md.price_range,
    md.opening_hours,
    md.contact_info,
    md.similarity
  FROM match_muva_documents(
    query_embedding,
    0.2,
    match_count,
    'restaurant',
    location_filter,
    NULL,
    min_rating
  ) md
  WHERE (price_filter IS NULL OR md.price_range = price_filter);
$$;

-- Create helper function for attractions
CREATE OR REPLACE FUNCTION search_muva_attractions(
  query_embedding vector(3072),
  location_filter text DEFAULT NULL,
  min_rating float DEFAULT NULL,
  match_count int DEFAULT 4
)
RETURNS TABLE (
  id text,
  title text,
  description text,
  location text,
  category text,
  rating decimal,
  opening_hours text,
  tags text[],
  similarity float
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    md.id,
    md.title,
    md.description,
    md.location,
    md.category,
    md.rating,
    md.opening_hours,
    md.tags,
    md.similarity
  FROM match_muva_documents(
    query_embedding,
    0.2,
    match_count,
    NULL,
    location_filter,
    NULL,
    min_rating
  ) md
  WHERE md.category IN ('attraction', 'beach', 'culture', 'nature', 'adventure');
$$;

-- Grant permissions to helper functions
GRANT EXECUTE ON FUNCTION search_muva_restaurants TO anon;
GRANT EXECUTE ON FUNCTION search_muva_restaurants TO authenticated;
GRANT EXECUTE ON FUNCTION search_muva_restaurants TO service_role;

GRANT EXECUTE ON FUNCTION search_muva_attractions TO anon;
GRANT EXECUTE ON FUNCTION search_muva_attractions TO authenticated;
GRANT EXECUTE ON FUNCTION search_muva_attractions TO service_role;