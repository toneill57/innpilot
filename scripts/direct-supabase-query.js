#!/usr/bin/env node

/**
 * Direct Supabase Query Tool for InnPilot
 *
 * Alternative to MCP tools when they're not available
 * Run: node scripts/direct-supabase-query.js
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runQuery(query, params = []) {
  try {
    console.log(`🔍 Executing: ${query}`);
    const { data, error, count } = await supabase.rpc('direct_sql', {
      query,
      params
    });

    if (error) {
      // Fallback for simple queries
      if (query.includes('SELECT COUNT(*)')) {
        const { count, error: countError } = await supabase
          .from('document_embeddings')
          .select('*', { count: 'exact', head: true });

        if (countError) {
          console.error('❌ Query error:', countError.message);
          return;
        }

        console.log('✅ Result:', { total_embeddings: count });
        return;
      }

      console.error('❌ Query error:', error.message);
      return;
    }

    console.log('✅ Result:', data);
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

async function checkEmbeddingsStatus() {
  console.log('📊 Document Embeddings Status\n');

  try {
    // Check total count
    const { count, error } = await supabase
      .from('document_embeddings')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    console.log(`✅ Total embeddings: ${count}`);

    // Get sample data
    const { data: sample, error: sampleError } = await supabase
      .from('document_embeddings')
      .select('source_file, chunk_index, created_at')
      .limit(3);

    if (sampleError) {
      console.error('❌ Sample error:', sampleError.message);
      return;
    }

    console.log('\n📄 Sample documents:');
    sample.forEach(doc => {
      console.log(`- ${doc.source_file} (chunk ${doc.chunk_index})`);
    });

    // Check for null embeddings
    const { count: nullCount, error: nullError } = await supabase
      .from('document_embeddings')
      .select('*', { count: 'exact', head: true })
      .is('embedding', null);

    if (!nullError) {
      console.log(`\n🔍 Null embeddings: ${nullCount}`);
    }

  } catch (error) {
    console.error('❌ Status check error:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🗄️ Direct Supabase Query Tool\n');

  // Check connection
  console.log('🔗 Testing connection...');
  const { data, error } = await supabase.from('document_embeddings').select('count', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n🔧 Check your .env.local file configuration');
    return;
  }

  console.log('✅ Connection successful\n');

  // Run status check
  await checkEmbeddingsStatus();

  console.log('\n💡 Usage: Modify this script to run custom queries');
  console.log('📝 Example: await runQuery("SELECT * FROM document_embeddings LIMIT 1")');
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runQuery, checkEmbeddingsStatus };