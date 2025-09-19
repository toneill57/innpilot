#!/usr/bin/env node

/**
 * Direct pgvector SQL execution using Supabase client
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

// Create client with service role
const supabase = createClient(supabaseUrl, serviceRoleKey)

async function executePgvectorFunction() {
  console.log('🚀 Setting up pgvector function with service role...')

  try {
    // Read SQL
    const sqlPath = join(__dirname, '../sql/match_documents_function.sql')
    const sqlContent = readFileSync(sqlPath, 'utf8')

    console.log('📝 Creating function...')

    // Split SQL into statements and execute each
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'))

    for (const statement of statements) {
      if (statement.includes('CREATE OR REPLACE FUNCTION')) {
        console.log('   Creating match_documents function...')
      } else if (statement.includes('GRANT EXECUTE')) {
        console.log('   Granting permissions...')
      }

      const { error } = await supabase
        .from('_sql')
        .select('*')
        .eq('query', statement)

      // Try alternative method
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: statement })
      })
    }

    console.log('✅ Function creation attempted')

    // Test the function
    console.log('🧪 Testing function...')

    const testEmbedding = new Array(3072).fill(0).map(() => Math.random() * 2 - 1)

    const { data, error } = await supabase
      .rpc('match_documents', {
        query_embedding: testEmbedding,
        match_threshold: 0.1,
        match_count: 1
      })

    if (error) {
      console.log('⚠️  Function test failed:', error.message)
      console.log('\n📝 Please execute this SQL manually in Supabase Dashboard:')
      console.log('🔗 https://supabase.com/dashboard/project/ooaumjzaztmutltifhoq/sql')
      console.log('\n' + sqlContent)
      return false
    }

    console.log('✅ Function test successful!')
    console.log(`📊 Found ${data?.length || 0} test results`)
    return true

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    return false
  }
}

// Execute
if (import.meta.url === `file://${process.argv[1]}`) {
  executePgvectorFunction()
    .then(success => {
      if (success) {
        console.log('\n🎉 pgvector function is ready!')
        console.log('\n📋 Test performance:')
        console.log('curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d \'{"question":"test"}\' | jq \'.performance.total_time_ms\'')
      }
    })
    .catch(console.error)
}