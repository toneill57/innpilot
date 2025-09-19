#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createVectorFunction() {
  console.log('Creating native vector search function...');

  const sqlFunction = `
    CREATE OR REPLACE FUNCTION match_documents(
      query_embedding vector(3072),
      match_threshold float DEFAULT 0.3,
      match_count int DEFAULT 4
    )
    RETURNS TABLE(
      id uuid,
      content text,
      similarity float
    )
    LANGUAGE plpgsql AS $$
    BEGIN
      RETURN QUERY
      SELECT
        d.id,
        d.content,
        (d.embedding <#> query_embedding) * -1 AS similarity
      FROM document_embeddings d
      WHERE (d.embedding <#> query_embedding) * -1 > match_threshold
      ORDER BY d.embedding <#> query_embedding
      LIMIT match_count;
    END;
    $$;
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlFunction });

    if (error) {
      console.error('Error creating function:', error);
      process.exit(1);
    }

    console.log('✅ Native vector search function created successfully!');
  } catch (err) {
    console.error('Failed to create function:', err);
    process.exit(1);
  }
}

createVectorFunction();