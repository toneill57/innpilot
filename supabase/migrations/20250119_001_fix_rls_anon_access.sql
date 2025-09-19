-- Fix RLS to allow anon role access for embeddings search
-- The application uses SUPABASE_ANON_KEY which maps to 'anon' role
BEGIN;

-- Add policy for anonymous users to read document embeddings
-- This is needed for the chat functionality to work
CREATE POLICY "Allow anonymous users to read document embeddings"
ON public.document_embeddings
FOR SELECT
TO anon
USING (true);

-- Verify policies are created
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd FROM pg_policies WHERE tablename = 'document_embeddings';

COMMIT;