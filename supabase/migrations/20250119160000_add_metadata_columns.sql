-- Migration: Add metadata columns to support documentation template
-- This will activate the existing unused indexes for category, tags, keywords
-- Date: 2025-01-19
-- Purpose: Enable metadata from YAML frontmatter to be stored and searchable

BEGIN;

-- Core metadata fields from documentation template frontmatter
-- These match exactly with the YAML fields defined in _assets/templates/documentation-template.md

-- Basic document metadata
ALTER TABLE document_embeddings ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE document_embeddings ADD COLUMN IF NOT EXISTS description TEXT;

-- Document classification (will activate idx_document_embeddings_category)
ALTER TABLE document_embeddings ADD COLUMN IF NOT EXISTS category TEXT;

-- Document status and versioning
ALTER TABLE document_embeddings ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE document_embeddings ADD COLUMN IF NOT EXISTS version TEXT;
ALTER TABLE document_embeddings ADD COLUMN IF NOT EXISTS last_updated DATE;

-- Array fields for searchability (will activate the GIN indexes)
-- These will activate idx_document_embeddings_tags_gin
ALTER TABLE document_embeddings ADD COLUMN IF NOT EXISTS tags TEXT[];

-- These will activate idx_document_embeddings_keywords_gin
ALTER TABLE document_embeddings ADD COLUMN IF NOT EXISTS keywords TEXT[];

-- Additional metadata for better organization
ALTER TABLE document_embeddings ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'es';
ALTER TABLE document_embeddings ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'text-embedding-3-large';

-- Add comments for documentation
COMMENT ON COLUMN document_embeddings.title IS 'Document title from YAML frontmatter';
COMMENT ON COLUMN document_embeddings.description IS 'Brief description of document purpose';
COMMENT ON COLUMN document_embeddings.category IS 'Document category: technical|regulatory|operational';
COMMENT ON COLUMN document_embeddings.status IS 'Document status: active|draft|production-ready';
COMMENT ON COLUMN document_embeddings.version IS 'Document version from frontmatter';
COMMENT ON COLUMN document_embeddings.last_updated IS 'Last update date from frontmatter';
COMMENT ON COLUMN document_embeddings.tags IS 'Array of tags for categorization and search';
COMMENT ON COLUMN document_embeddings.keywords IS 'Array of keywords for enhanced search';
COMMENT ON COLUMN document_embeddings.language IS 'Document language code';
COMMENT ON COLUMN document_embeddings.embedding_model IS 'OpenAI model used for embeddings';

-- Verify the table structure after adding columns
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'document_embeddings'
-- ORDER BY ordinal_position;

COMMIT;