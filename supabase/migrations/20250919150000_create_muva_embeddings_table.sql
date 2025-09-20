-- Create MUVA embeddings table for tourism content
-- Separate from SIRE document_embeddings to maintain domain separation

CREATE TABLE IF NOT EXISTS muva_embeddings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  content TEXT NOT NULL,
  embedding vector(3072), -- OpenAI text-embedding-3-large dimension

  -- Tourism-specific metadata
  title TEXT,
  description TEXT,
  category TEXT CHECK (category IN (
    'restaurant', 'attraction', 'activity', 'hotel',
    'transport', 'shopping', 'nightlife', 'beach',
    'culture', 'nature', 'adventure', 'guide'
  )),
  location TEXT, -- San Andrés, Providencia, etc.
  city TEXT,
  coordinates POINT, -- Geographic coordinates for mapping
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  price_range TEXT CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),

  -- Content organization
  source_file TEXT,
  chunk_index INTEGER DEFAULT 0,
  total_chunks INTEGER DEFAULT 1,

  -- Tourism metadata
  opening_hours TEXT,
  contact_info JSONB,
  tags TEXT[],
  language TEXT DEFAULT 'es',

  -- System fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_muva_embeddings_vector ON muva_embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_muva_category ON muva_embeddings(category);
CREATE INDEX IF NOT EXISTS idx_muva_location ON muva_embeddings(location);
CREATE INDEX IF NOT EXISTS idx_muva_city ON muva_embeddings(city);
CREATE INDEX IF NOT EXISTS idx_muva_rating ON muva_embeddings(rating);
CREATE INDEX IF NOT EXISTS idx_muva_created_at ON muva_embeddings(created_at);

-- Enable Row Level Security
ALTER TABLE muva_embeddings ENABLE ROW LEVEL SECURITY;

-- Policies for access control
CREATE POLICY "Allow anonymous read access to muva_embeddings" ON muva_embeddings
FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert muva_embeddings" ON muva_embeddings
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow service role full access to muva_embeddings" ON muva_embeddings
FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON muva_embeddings TO anon;
GRANT ALL ON muva_embeddings TO authenticated;
GRANT ALL ON muva_embeddings TO service_role;

-- Add update trigger for updated_at
CREATE OR REPLACE FUNCTION update_muva_embeddings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_muva_embeddings_updated_at
  BEFORE UPDATE ON muva_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_muva_embeddings_updated_at();