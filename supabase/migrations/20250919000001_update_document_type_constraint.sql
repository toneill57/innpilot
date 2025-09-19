-- Migration: Update document_type constraint to accept all template values
-- Date: 2025-09-19
-- Purpose: Allow all document_type values from template + additional project types

BEGIN;

-- Step 1: Drop the existing restrictive constraint
-- This constraint currently only allows 'sire_docs' and 'regulatory'
ALTER TABLE document_embeddings
DROP CONSTRAINT IF EXISTS document_embeddings_document_type_check;

-- Step 2: Create new constraint with all required values
-- Template values: sire-docs, technical, regulatory, operational, template
-- Additional project values: muva, iot, ticketing
-- Note: Using underscore format (sire_docs) instead of hyphen (sire-docs)
ALTER TABLE document_embeddings
ADD CONSTRAINT document_embeddings_document_type_check
CHECK (document_type IN (
  'sire_docs',     -- SIRE documentation (existing)
  'regulatory',    -- Regulatory documentation (existing)
  'technical',     -- Technical documentation (from template)
  'operational',   -- Operational documentation (from template)
  'template',      -- Template documentation (from template)
  'muva',          -- MUVA project documentation
  'iot',           -- IoT project documentation
  'ticketing'      -- Ticketing system documentation
));

-- Step 3: Add comment for documentation
COMMENT ON CONSTRAINT document_embeddings_document_type_check
ON document_embeddings IS 'Allows all document types from template plus additional project types: sire_docs, regulatory, technical, operational, template, muva, iot, ticketing';

-- Verification query (can be run manually to test):
-- INSERT INTO document_embeddings (content, document_type, source_file, chunk_index, total_chunks)
-- VALUES ('test', 'technical', 'test.md', 0, 1);
--
-- SELECT * FROM document_embeddings WHERE content = 'test';
--
-- DELETE FROM document_embeddings WHERE content = 'test';

COMMIT;