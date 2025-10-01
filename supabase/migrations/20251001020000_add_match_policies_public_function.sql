-- ============================================================================
-- Create match_policies_public function for Public Chat
-- ============================================================================
-- Purpose: Vector search for hotel policies using fast 1024d embeddings
-- Usage: Public/anonymous visitors searching for cancellation, check-in, etc.
-- Schema: hotels.policies (not public.policies)
-- ============================================================================

CREATE OR REPLACE FUNCTION match_policies_public(
  query_embedding vector(1024),
  p_tenant_id UUID,
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  policy_id UUID,
  title TEXT,
  content TEXT,
  policy_type TEXT,
  similarity FLOAT,
  source_file TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.policy_id as id,
    p.policy_id,
    p.policy_title::TEXT as title,
    p.policy_content::TEXT as content,
    p.policy_type::TEXT,
    (1 - (p.embedding_fast <=> query_embedding))::FLOAT as similarity,
    ('policy_' || p.policy_type)::TEXT as source_file
  FROM hotels.policies p
  WHERE p.tenant_id::uuid = p_tenant_id
    AND p.is_active = true
    AND p.embedding_fast IS NOT NULL
    AND (1 - (p.embedding_fast <=> query_embedding)) > match_threshold
  ORDER BY p.embedding_fast <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION match_policies_public TO authenticated, anon;

COMMENT ON FUNCTION match_policies_public IS
'Vector similarity search for hotel policies using 1024d fast embeddings. For public/anonymous chat.';
