-- Migration: Drop unused last_updated column
-- Date: 2025-09-19
-- Purpose: Clean up unused last_updated column (replaced by updated_at)

BEGIN;

-- Drop the unused last_updated column
-- This column was replaced by updated_at which follows the template standard
ALTER TABLE document_embeddings
DROP COLUMN IF EXISTS last_updated;

-- Add comment documenting the change
COMMENT ON TABLE document_embeddings IS 'Document embeddings table - cleaned up unused columns (removed last_updated, kept updated_at)';

-- Note: page_number is kept as it may be used for PDF documents in the future
-- but last_updated is completely obsolete since we use updated_at

COMMIT;