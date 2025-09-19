-- Migration: Add missing metadata columns from documentation template
-- Date: 2025-09-19
-- Purpose: Add columns that the populate-embeddings script expects but are missing from schema

BEGIN;

-- Add the missing columns that the populate-embeddings script tries to insert
-- but don't exist in the current schema

-- Section navigation metadata
ALTER TABLE document_embeddings ADD COLUMN IF NOT EXISTS section_title TEXT;

-- Page number for PDFs (nullable for markdown files)
ALTER TABLE document_embeddings ADD COLUMN IF NOT EXISTS page_number INTEGER;

-- Token count for chunk size tracking
ALTER TABLE document_embeddings ADD COLUMN IF NOT EXISTS token_count INTEGER;

-- Timestamps - rename last_updated to updated_at to match template
-- Add created_at for full timestamp tracking
ALTER TABLE document_embeddings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE document_embeddings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Copy data from last_updated to updated_at if last_updated exists
-- This handles the case where the previous migration already added last_updated
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'document_embeddings'
        AND column_name = 'last_updated'
    ) THEN
        UPDATE document_embeddings
        SET updated_at = last_updated::timestamp with time zone
        WHERE last_updated IS NOT NULL AND updated_at IS NULL;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN document_embeddings.section_title IS 'Section or chapter title for navigation within document';
COMMENT ON COLUMN document_embeddings.page_number IS 'Page number for PDFs, null for markdown files';
COMMENT ON COLUMN document_embeddings.token_count IS 'Approximate token count for the chunk';
COMMENT ON COLUMN document_embeddings.updated_at IS 'Last update timestamp from frontmatter or processing time';
COMMENT ON COLUMN document_embeddings.created_at IS 'Creation timestamp from frontmatter or processing time';

-- Create indexes for better performance on commonly queried fields
CREATE INDEX IF NOT EXISTS idx_document_embeddings_updated_at
ON document_embeddings(updated_at);

CREATE INDEX IF NOT EXISTS idx_document_embeddings_token_count
ON document_embeddings(token_count) WHERE token_count IS NOT NULL;

-- Verify the table structure includes all expected columns
-- This query can be run manually to check the migration worked:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'document_embeddings'
-- ORDER BY ordinal_position;

COMMIT;