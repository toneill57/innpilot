-- Fixed SQL function for pgvector-powered document search
-- Adjusted to match actual table structure

CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(3072),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 4
)
RETURNS TABLE (
  id text,
  content text,
  embedding vector(3072),
  source_file text,
  document_type text,
  chunk_index int,
  total_chunks int,
  created_at timestamptz,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    content,
    embedding,
    source_file,
    document_type,
    chunk_index,
    total_chunks,
    created_at,
    1 - (embedding <=> query_embedding) as similarity
  FROM document_embeddings
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION match_documents TO anon;
GRANT EXECUTE ON FUNCTION match_documents TO authenticated;