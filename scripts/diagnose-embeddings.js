import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

async function diagnoseEmbeddings() {
  try {
    console.log('🔍 Diagnosing Embedding Issues')
    console.log('=' .repeat(50))

    // Check embedding format
    const { data, error } = await supabase
      .from('document_embeddings')
      .select('source_file, embedding')
      .limit(1)

    if (error) {
      console.error('❌ Error fetching embeddings:', error)
      return
    }

    if (data && data.length > 0) {
      const embedding = data[0].embedding
      console.log(`📊 Source: ${data[0].source_file}`)
      console.log(`📊 Embedding type: ${typeof embedding}`)
      console.log(`📊 Embedding is array: ${Array.isArray(embedding)}`)
      console.log(`📊 Embedding length: ${embedding?.length || 'N/A'}`)
      console.log(`📊 First few values: ${embedding?.slice(0, 5) || 'N/A'}`)

      if (typeof embedding === 'string') {
        console.log('⚠️  Embedding is stored as string, parsing...')
        try {
          const parsed = JSON.parse(embedding)
          console.log(`📊 Parsed type: ${typeof parsed}`)
          console.log(`📊 Parsed is array: ${Array.isArray(parsed)}`)
          console.log(`📊 Parsed length: ${parsed?.length || 'N/A'}`)
        } catch (parseError) {
          console.error('❌ Failed to parse embedding as JSON:', parseError.message)
        }
      }
    }

    // Check if pgvector function exists
    console.log('\n🔍 Checking pgvector function...')
    try {
      const { data: funcData, error: funcError } = await supabase.rpc('match_documents', {
        query_embedding: new Array(3072).fill(0),
        similarity_threshold: 0.5,
        match_count: 1
      })

      if (funcError) {
        console.log('❌ pgvector function error:', funcError.message)
      } else {
        console.log('✅ pgvector function exists and works')
      }
    } catch (err) {
      console.log('❌ pgvector function test failed:', err.message)
    }

    // Check database schema
    console.log('\n🔍 Checking database schema...')
    const { data: schemaData, error: schemaError } = await supabase
      .from('document_embeddings')
      .select('*')
      .limit(0)

    if (schemaError) {
      console.error('❌ Schema error:', schemaError)
    } else {
      console.log('✅ Table exists and is accessible')
    }

  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

diagnoseEmbeddings()