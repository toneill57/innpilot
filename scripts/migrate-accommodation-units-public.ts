#!/usr/bin/env npx tsx
/**
 * Data Migration: Populate accommodation_units_public table
 * Description: Transform accommodation_units to marketing-focused public data
 * Usage: npx tsx scripts/migrate-accommodation-units-public.ts
 * Created: 2025-10-01
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface AccommodationUnit {
  id: string;
  tenant_id: string;
  hotel_id: string;
  name: string;
  unit_number: string;
  unit_type: string;
  description: string;
  short_description: string;
  capacity: any;
  bed_configuration: any;
  size_m2: number;
  view_type: string;
  tourism_features: any;
  images: any;
}

interface PublicAccommodation {
  tenant_id: string;
  name: string;
  unit_number: string;
  unit_type: string;
  description: string;
  short_description: string;
  highlights: string[];
  amenities: any;
  pricing: any;
  photos: any[];
  embedding: number[];
  embedding_fast: number[];
  metadata: any;
}

/**
 * Generate embeddings using OpenAI Matryoshka architecture
 */
async function generateEmbeddings(text: string): Promise<{
  embedding_3072: number[];
  embedding_1024: number[];
}> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
      dimensions: 3072, // Full precision
    });

    const embedding_3072 = response.data[0].embedding;
    
    // Matryoshka: Tier 1 is first 1024 dimensions
    const embedding_1024 = embedding_3072.slice(0, 1024);

    return { embedding_3072, embedding_1024 };
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

/**
 * Transform accommodation unit to marketing-focused public format
 */
function transformToPublic(unit: AccommodationUnit): Omit<PublicAccommodation, 'embedding' | 'embedding_fast'> {
  // Extract highlights from description or features
  const highlights: string[] = [];
  if (unit.view_type) highlights.push(`${unit.view_type} view`);
  if (unit.tourism_features?.unique_selling_points) {
    highlights.push(...unit.tourism_features.unique_selling_points.slice(0, 3));
  }

  // Build amenities object
  const amenities = {
    bedrooms: unit.capacity?.bedrooms || 1,
    bathrooms: unit.capacity?.bathrooms || 1,
    max_guests: unit.capacity?.max_guests || 2,
    size_sqm: unit.size_m2 || null,
    features: unit.tourism_features?.amenities || [],
    accessibility: unit.tourism_features?.accessibility_features || [],
  };

  // Build pricing (placeholder - should be fetched from booking system)
  const pricing = {
    base_price_night: 100, // TODO: Fetch from MotoPress or booking system
    currency: 'USD',
    seasonal_pricing: [],
    min_nights: 2,
  };

  // Transform images to photos format
  const photos = Array.isArray(unit.images) 
    ? unit.images.map((img: any, idx: number) => ({
        url: img.url || img,
        alt: img.alt || `${unit.name} - Photo ${idx + 1}`,
        order: idx + 1,
        type: idx === 0 ? 'main' : 'gallery',
      }))
    : [];

  // Marketing-optimized description
  const description = unit.description || `Beautiful ${unit.unit_type} in ${unit.name}`;
  const short_description = unit.short_description || description.substring(0, 150);

  return {
    tenant_id: unit.tenant_id,
    name: unit.name,
    unit_number: unit.unit_number,
    unit_type: unit.unit_type,
    description,
    short_description,
    highlights,
    amenities,
    pricing,
    photos,
    metadata: {
      source_unit_id: unit.id,
      hotel_id: unit.hotel_id,
      bed_configuration: unit.bed_configuration,
    },
  };
}

/**
 * Main migration function
 */
async function migrateAccommodations() {
  console.log('Starting accommodation_units_public migration...\n');

  try {
    // Fetch all active accommodation units
    const { data: units, error: fetchError } = await supabase
      .from('accommodation_units')
      .select('*')
      .eq('status', 'active');

    if (fetchError) throw fetchError;

    if (!units || units.length === 0) {
      console.log('No accommodation units found. Creating sample data...');
      // TODO: Create sample data or exit
      return;
    }

    console.log(`Found ${units.length} accommodation units to migrate\n`);

    let successCount = 0;
    let errorCount = 0;

    // Process each unit
    for (const unit of units) {
      try {
        console.log(`Processing: ${unit.name} (${unit.unit_number})...`);

        // Transform to public format
        const publicUnit = transformToPublic(unit);

        // Generate marketing-focused embedding text
        const embeddingText = `
${publicUnit.name}
${publicUnit.description}
Type: ${publicUnit.unit_type}
Highlights: ${publicUnit.highlights.join(', ')}
Amenities: ${publicUnit.amenities.features.join(', ')}
Capacity: ${publicUnit.amenities.max_guests} guests, ${publicUnit.amenities.bedrooms} bedrooms
Price: $${publicUnit.pricing.base_price_night}/night
        `.trim();

        // Generate embeddings
        console.log('  - Generating embeddings...');
        const { embedding_3072, embedding_1024 } = await generateEmbeddings(embeddingText);

        // Insert into accommodation_units_public
        const { error: insertError } = await supabase
          .from('accommodation_units_public')
          .insert({
            ...publicUnit,
            embedding: embedding_3072,
            embedding_fast: embedding_1024,
          });

        if (insertError) throw insertError;

        console.log('  ✓ Successfully migrated\n');
        successCount++;

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`  ✗ Error migrating ${unit.name}:`, error);
        errorCount++;
      }
    }

    console.log('\n========================================');
    console.log('Migration Complete');
    console.log('========================================');
    console.log(`✓ Successfully migrated: ${successCount}`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('Fatal migration error:', error);
    process.exit(1);
  }
}

// Run migration
migrateAccommodations().catch(console.error);
