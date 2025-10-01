-- Migration: Add accommodation_units_public table for Public Chat System (FASE B)
-- Description: Marketing-focused accommodation data with public embeddings for anonymous visitors
-- Created: 2025-10-01

-- Create accommodation_units_public table
CREATE TABLE IF NOT EXISTS accommodation_units_public (
  unit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenant_registry(tenant_id) ON DELETE CASCADE,

  -- Basic Information
  name TEXT NOT NULL,
  unit_number TEXT,
  unit_type VARCHAR(50),
  -- Values: 'apartment' | 'suite' | 'room' | 'studio' | 'penthouse'

  -- Marketing Description (PUBLIC - optimized for conversion)
  description TEXT NOT NULL,
  -- Full marketing description with selling points
  short_description TEXT,
  -- Concise description for listings (max 150 chars recommended)
  highlights JSONB DEFAULT '[]'::jsonb NOT NULL,
  -- Array of key selling points: ['Ocean view', 'Full kitchen', 'Private balcony']

  -- Amenities (PUBLIC - detailed features for filtering)
  amenities JSONB DEFAULT '{}'::jsonb NOT NULL,
  -- Structure: {
  --   bedrooms: 2,
  --   bathrooms: 2,
  --   max_guests: 6,
  --   size_sqm: 85,
  --   features: ['wifi', 'ac', 'kitchen', 'balcony', 'ocean_view'],
  --   accessibility: ['elevator', 'wheelchair_accessible']
  -- }

  -- Pricing (PUBLIC - transparent pricing for prospective guests)
  pricing JSONB DEFAULT '{}'::jsonb NOT NULL,
  -- Structure: {
  --   base_price_night: 150,
  --   currency: 'USD',
  --   seasonal_pricing: [
  --     { season: 'high', multiplier: 1.5, months: [12, 1, 2] },
  --     { season: 'low', multiplier: 0.8, months: [4, 5, 9, 10] }
  --   ],
  --   min_nights: 3,
  --   cleaning_fee: 50
  -- }

  -- Media (PUBLIC - photos and virtual tours)
  photos JSONB DEFAULT '[]'::jsonb NOT NULL,
  -- Structure: [ 
  --   { url: 'https://...', alt: 'Ocean view from balcony', order: 1, type: 'main' },
  --   { url: 'https://...', alt: 'Living room', order: 2, type: 'gallery' }
  -- ]
  virtual_tour_url TEXT,

  -- Vector Embeddings (Matryoshka Architecture)
  embedding vector(3072),
  -- Tier 3: Full precision embedding for complex semantic search
  embedding_fast vector(1024),
  -- Tier 1: Fast embedding for marketing queries (HNSW indexed)

  -- Metadata (additional structured data)
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  -- Flexible field for location, policies, custom attributes

  -- Status Management
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_bookable BOOLEAN DEFAULT true NOT NULL,

  -- Audit Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add table comments
COMMENT ON TABLE accommodation_units_public IS 'Marketing-focused accommodation data for PUBLIC chat system. Optimized for anonymous prospective guests with pricing, photos, and semantic search.';
COMMENT ON COLUMN accommodation_units_public.description IS 'Full marketing description emphasizing selling points and unique features';
COMMENT ON COLUMN accommodation_units_public.short_description IS 'Concise description for search results and listings (150 chars max recommended)';
COMMENT ON COLUMN accommodation_units_public.highlights IS 'Array of key features to display as badges/tags';
COMMENT ON COLUMN accommodation_units_public.embedding_fast IS 'Matryoshka Tier 1 (1024d) for ultra-fast semantic search on marketing queries';
COMMENT ON COLUMN accommodation_units_public.embedding IS 'Matryoshka Tier 3 (3072d) for full-precision semantic search when needed';

-- Performance Indexes
CREATE INDEX idx_accommodation_public_tenant 
  ON accommodation_units_public(tenant_id) 
  WHERE is_active = true;

CREATE INDEX idx_accommodation_public_type 
  ON accommodation_units_public(tenant_id, unit_type)
  WHERE is_active = true AND is_bookable = true;

-- HNSW vector index for FAST embeddings (Tier 1 - marketing queries)
CREATE INDEX idx_accommodation_public_embedding_fast_hnsw
  ON accommodation_units_public 
  USING hnsw (embedding_fast vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

COMMENT ON INDEX idx_accommodation_public_embedding_fast_hnsw IS 'HNSW index for ultra-fast vector search on marketing queries using 1024d embeddings';

-- Optional: ivfflat index for full precision embeddings (Tier 3)
-- Uncomment when dataset grows beyond 1000 records
-- CREATE INDEX idx_accommodation_public_embedding_ivfflat
--   ON accommodation_units_public 
--   USING ivfflat (embedding vector_cosine_ops)
--   WITH (lists = 100);

-- Enable Row Level Security
ALTER TABLE accommodation_units_public ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read access for active and bookable units (no auth required)
CREATE POLICY accommodation_public_read_all ON accommodation_units_public
  FOR SELECT
  USING (is_active = true AND is_bookable = true);

-- RLS Policy: Staff can manage their tenant's accommodations
CREATE POLICY accommodation_public_staff_manage ON accommodation_units_public
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM staff_users 
      WHERE staff_id::text = current_setting('request.jwt.claim.sub', true)
    )
  );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_accommodation_units_public_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_accommodation_units_public_updated_at
  BEFORE UPDATE ON accommodation_units_public
  FOR EACH ROW
  EXECUTE FUNCTION update_accommodation_units_public_updated_at();
