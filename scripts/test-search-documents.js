import { config } from 'dotenv'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

async function testSearchDocuments() {
  console.log('🧪 Testing document search for "untrusted-data" issue...')

  try {
    // Step 1: Generate embedding for a test question
    const question = "¿Cuáles son los pasos para reportar al SIRE?"
    console.log('\n📝 Test question:', question)

    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: question,
      encoding_format: 'float',
    })
    const queryEmbedding = embeddingResponse.data[0].embedding
    console.log('✅ Embedding generated, dimension:', queryEmbedding.length)

    // Step 2: Call the match_documents function directly
    console.log('\n🔍 Calling match_documents function...')

    const { data, error } = await supabase
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.1,
        match_count: 4
      })

    if (error) {
      console.error('❌ Error from match_documents:', error)
      return
    }

    console.log(`✅ Found ${data.length} results`)

    // Step 3: Examine each result in detail
    data.forEach((doc, i) => {
      console.log(`\n--- Result ${i + 1} ---`)
      console.log('ID:', doc.id)
      console.log('Source File:', doc.source_file)
      console.log('Document Type:', doc.document_type)
      console.log('Chunk Index:', doc.chunk_index)
      console.log('Similarity:', doc.similarity)
      console.log('Content length:', doc.content.length)
      console.log('Content (first 200 chars):')
      console.log(doc.content.substring(0, 200))

      // Check for problematic content
      if (doc.content.includes('untrusted-data')) {
        console.log('🚨 FOUND "untrusted-data" in content!')
      }
      if (doc.content.includes('<untrusted-data-')) {
        console.log('🚨 FOUND untrusted-data wrapper in content!')
      }

      console.log('--- End Result ---')
    })

    // Step 4: Test the searchDocuments function from lib/supabase.ts
    console.log('\n🔧 Testing searchDocuments function...')

    // Import the searchDocuments function
    const { searchDocuments } = await import('../src/lib/supabase.js')

    const searchResults = await searchDocuments(queryEmbedding, 0.1, 4)
    console.log(`✅ searchDocuments returned ${searchResults.length} results`)

    searchResults.forEach((doc, i) => {
      console.log(`\n--- Search Result ${i + 1} ---`)
      console.log('ID:', doc.id)
      console.log('Source File:', doc.source_file)
      console.log('Document Type:', doc.document_type)
      console.log('Content length:', doc.content.length)
      console.log('Content (first 200 chars):')
      console.log(doc.content.substring(0, 200))

      // Check for problematic content
      if (doc.content.includes('untrusted-data')) {
        console.log('🚨 FOUND "untrusted-data" in search result!')
      }
      if (doc.content.includes('<untrusted-data-')) {
        console.log('🚨 FOUND untrusted-data wrapper in search result!')
      }

      console.log('--- End Search Result ---')
    })

  } catch (error) {
    console.error('❌ Fatal error:', error.message)
  }
}

testSearchDocuments()