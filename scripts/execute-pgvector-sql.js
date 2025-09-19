#!/usr/bin/env node

/**
 * Direct SQL execution for pgvector function
 * Uses service role key to execute SQL via REST API
 */

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
  console.error('❌ Missing required environment variables:')
  console.error('- SUPABASE_URL:', supabaseUrl ? '✓' : '❌')
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓' : '❌')
  process.exit(1)
}

async function executePgvectorSQL() {
  console.log('🚀 Executing pgvector function SQL...')

  try {
    // Read the SQL function
    const sqlPath = join(__dirname, '../sql/match_documents_function.sql')
    const sqlContent = readFileSync(sqlPath, 'utf8')

    console.log('📝 Executing SQL via REST API...')

    // Execute SQL via Supabase REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql: sqlContent })
    })

    if (!response.ok) {
      // Try alternative method - direct SQL execution
      console.log('⚠️  RPC method failed, trying direct SQL execution...')

      const directResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/sql'
        },
        body: sqlContent
      })

      if (!directResponse.ok) {
        throw new Error(`SQL execution failed: ${response.status} ${response.statusText}`)
      }
    }

    console.log('✅ SQL execution completed!')

    // Test the function
    console.log('🧪 Testing the function...')

    const testEmbedding = new Array(3072).fill(0).map(() => Math.random() * 2 - 1)

    const testResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/match_documents`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query_embedding: testEmbedding,
        match_threshold: 0.1,
        match_count: 1
      })
    })

    if (!testResponse.ok) {
      throw new Error(`Function test failed: ${testResponse.status} ${testResponse.statusText}`)
    }

    const testData = await testResponse.json()
    console.log('✅ Function test successful!')
    console.log(`📊 Found ${testData?.length || 0} test results`)

    console.log('\n🎉 pgvector function implemented successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Test performance: curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d \'{"question":"test"}\' | jq \'.performance.total_time_ms\'')
    console.log('2. Expected: ~400-600ms (vs 3000+ms before)')
    console.log('3. Check logs for: "Using native vector search function"')

  } catch (error) {
    console.error('❌ Execution failed:', error.message)
    console.log('\n📝 Manual fallback: Execute this SQL in Supabase Dashboard:')
    console.log('=' * 50)

    try {
      const sqlPath = join(__dirname, '../sql/match_documents_function.sql')
      const sql = readFileSync(sqlPath, 'utf8')
      console.log(sql)
    } catch (e) {
      console.log('Error reading SQL file:', e.message)
    }

    console.log('=' * 50)
    console.log('🔗 Go to: https://supabase.com/dashboard/project/ooaumjzaztmutltifhoq/sql')
    process.exit(1)
  }
}

// Run the execution
if (import.meta.url === `file://${process.argv[1]}`) {
  executePgvectorSQL().catch(console.error)
}