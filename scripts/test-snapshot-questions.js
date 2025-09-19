import { config } from 'dotenv'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

config({ path: '.env.local' })

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Helper functions
async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
    encoding_format: 'float',
  })
  return response.data[0].embedding
}

async function searchDocuments(queryEmbedding, threshold = 0.3, limit = 4) {
  console.log('🔍 Testing pgvector native search...')

  try {
    // Try native pgvector function first
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit
    })

    if (error) {
      console.log('❌ pgvector native function failed:', error.message)
      console.log('💡 Setup required: see PGVECTOR_SETUP_INSTRUCTIONS.md')
      return []
    }

    console.log(`✅ pgvector native search successful: ${data.length} results`)
    return data.map(doc => ({
      content: doc.content,
      source_file: doc.source_file,
      similarity: doc.similarity
    }))

  } catch (e) {
    console.log('❌ pgvector search error:', e.message)
    console.log('💡 Setup required: see PGVECTOR_SETUP_INSTRUCTIONS.md')
    return []
  }
}

function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

async function generateChatResponse(question, context) {
  const response = await claude.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-3-5-haiku-20241022',
    max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS) || 800,
    messages: [{
      role: 'user',
      content: context ?
        `Basándote en la siguiente información del contexto, responde la pregunta del usuario de forma precisa y completa.

Contexto:
${context}

Pregunta del usuario: ${question}

Responde en español y sé específico con datos y detalles cuando estén disponibles en el contexto.` :
        `Responde la siguiente pregunta sobre SIRE y hoteles en Colombia: ${question}`
    }]
  })

  return response.content[0].text
}

const SNAPSHOT_QUESTIONS = [
  "¿Cuál es la diferencia entre los tiempos de respuesta en localhost vs Vercel según el snapshot?",
  "¿Qué modelo de Claude está configurado en el proyecto según el snapshot?",
  "¿Cuántos chunks se generan del documento SNAPSHOT.md según la información?",
  "¿Cuál es el tamaño del bundle de la aplicación según las métricas?",
  "¿Qué porcentaje de mejora se logró con la implementación de pgvector?",
  "¿Cuál es el uptime reportado en Vercel US East?",
  "¿Qué comandos específicos se mencionan para el desarrollo con Turbopack?",
  "¿Cuáles son los próximos pasos inmediatos mencionados en el roadmap?"
]

async function testQuestion(question) {
  console.log(`\n🔍 Testing: "${question}"`)
  console.log('=' .repeat(80))

  try {
    // Generate embedding
    const queryEmbedding = await generateEmbedding(question)
    console.log('✅ Embedding generated')

    // Search documents with different thresholds
    const documents = await searchDocuments(queryEmbedding, 0.3, 4)
    console.log(`📄 Found ${documents.length} relevant documents`)

    // Show search results
    documents.forEach((doc, index) => {
      console.log(`\n📋 Document ${index + 1}:`)
      console.log(`   Source: ${doc.source_file}`)
      console.log(`   Similarity: ${doc.similarity?.toFixed(3) || 'N/A'}`)
      console.log(`   Content preview: ${doc.content.substring(0, 150)}...`)
    })

    // Build context
    const context = documents.map(doc => doc.content).join('\n\n')
    console.log(`\n📝 Context length: ${context.length} characters`)

    // Generate response
    if (context.length > 0) {
      const response = await generateChatResponse(question, context)
      console.log(`\n🤖 Claude Response:\n${response}`)
    } else {
      console.log('\n⚠️  No context found - generating response without context')
      const response = await generateChatResponse(question, '')
      console.log(`\n🤖 Claude Response (no context):\n${response}`)
    }

  } catch (error) {
    console.error(`❌ Error testing question: ${error.message}`)
  }
}

async function runTests() {
  console.log('🧪 Testing SNAPSHOT.md Question Retrieval')
  console.log('=' .repeat(80))

  // Test a couple of specific questions
  for (const question of SNAPSHOT_QUESTIONS.slice(0, 3)) {
    await testQuestion(question)
    await new Promise(resolve => setTimeout(resolve, 1000)) // Delay between tests
  }

  // Test search without specific question context
  console.log(`\n\n🔍 Testing direct SNAPSHOT search...`)
  try {
    const snapshotEmbedding = await generateEmbedding("InnPilot project status performance metrics")
    const snapshotDocs = await searchDocuments(snapshotEmbedding, 0.1, 10)

    console.log(`\n📊 SNAPSHOT.md chunks found: ${snapshotDocs.filter(d => d.source_file === 'SNAPSHOT.md').length}`)
    console.log(`📊 SIRE docs chunks found: ${snapshotDocs.filter(d => d.source_file === 'pasos-para-reportar-al-sire.md').length}`)

    snapshotDocs.slice(0, 5).forEach((doc, index) => {
      console.log(`\n📋 Result ${index + 1}:`)
      console.log(`   Source: ${doc.source_file}`)
      console.log(`   Similarity: ${doc.similarity?.toFixed(3) || 'N/A'}`)
      console.log(`   Content: ${doc.content.substring(0, 200)}...`)
    })

  } catch (error) {
    console.error(`❌ Error in direct search: ${error.message}`)
  }
}

runTests()