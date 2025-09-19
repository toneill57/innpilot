#!/usr/bin/env node

/**
 * Script to setup the pgvector match_documents function in Supabase
 * This optimizes vector search performance significantly
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('- SUPABASE_URL:', supabaseUrl ? '✓' : '❌')
  console.error('- SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY:', supabaseServiceKey ? '✓' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupVectorFunction() {
  console.log('🚀 Setting up pgvector match_documents function...')

  try {
    // Read the SQL function
    const sqlPath = join(__dirname, '../sql/match_documents_function.sql')
    const sql = readFileSync(sqlPath, 'utf8')

    console.log('📝 Executing SQL function creation...')

    // Execute the SQL function creation
    const { data, error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      // Try alternative method if exec_sql doesn't exist
      console.log('⚠️  exec_sql not available, trying direct query...')

      const { data: functionData, error: functionError } = await supabase
        .from('_supabase_admin')
        .select('*')
        .limit(1)

      if (functionError) {
        console.error('❌ Cannot execute SQL directly. Please run the SQL manually in Supabase Dashboard:')
        console.log('\n📄 SQL to execute:')
        console.log('=' * 50)
        console.log(sql)
        console.log('=' * 50)
        console.log('\n🔗 Go to: https://supabase.com/dashboard/project/[your-project]/sql')
        process.exit(1)
      }
    }

    console.log('✅ Function creation completed!')

    // Test the function
    console.log('🧪 Testing the function...')

    const testEmbedding = new Array(3072).fill(0).map(() => Math.random() * 2 - 1)

    const { data: testData, error: testError } = await supabase
      .rpc('match_documents', {
        query_embedding: testEmbedding,
        match_threshold: 0.1,
        match_count: 1
      })

    if (testError) {
      console.error('❌ Function test failed:', testError.message)
      console.log('📝 Manual setup required. Copy and paste this SQL in Supabase Dashboard:')
      console.log('\n' + sql)
    } else {
      console.log('✅ Function test successful!')
      console.log(`📊 Found ${testData?.length || 0} test results`)

      // Check if we have vector index
      const { data: indexData, error: indexError } = await supabase
        .rpc('exec_sql', {
          sql: `SELECT indexname FROM pg_indexes WHERE tablename = 'document_embeddings' AND indexname LIKE '%embedding%';`
        })

      if (!indexError && indexData?.length === 0) {
        console.log('💡 Recommendation: Create vector index for better performance:')
        console.log('CREATE INDEX document_embeddings_embedding_idx ON document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);')
      }
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    console.log('\n📝 Manual setup required. Execute this SQL in Supabase Dashboard:')
    console.log('=' * 50)
    const sqlPath = join(__dirname, '../sql/match_documents_function.sql')
    const sql = readFileSync(sqlPath, 'utf8')
    console.log(sql)
    console.log('=' * 50)
    process.exit(1)
  }
}

// Run the setup
setupVectorFunction().catch(console.error)