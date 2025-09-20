import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
config({ path: '.env.local' })

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function chunkDocument(content) {
  const CHUNK_SIZE = 1000
  const OVERLAP = 100

  // Same splitter as original
  const separators = [
    '\n## ',    // Main sections
    '\n### ',   // Subsections
    '\n\n',     // Paragraphs
    '\n',       // Lines
    '. ',       // Sentences
    '? ',       // Questions
    '! ',       // Exclamations
    '; ',       // Semicolons
    ', ',       // Commas
    ' ',        // Spaces
    ''          // Characters (last resort)
  ]

  function recursiveSplit(text) {
    if (text.length <= CHUNK_SIZE) {
      return [text]
    }

    const chunks = []
    let start = 0

    while (start < text.length) {
      let end = start + CHUNK_SIZE

      if (end >= text.length) {
        chunks.push(text.substring(start))
        break
      }

      let splitPoint = -1

      for (const separator of separators) {
        if (separator === '') {
          splitPoint = end
          break
        }

        const lastIndex = text.lastIndexOf(separator, end)

        if (lastIndex > start + CHUNK_SIZE / 2) {
          splitPoint = lastIndex + separator.length
          break
        }
      }

      if (splitPoint === -1) {
        splitPoint = end
      }

      chunks.push(text.substring(start, splitPoint))
      start = Math.max(splitPoint - OVERLAP, start + 1)
    }

    return chunks
  }

  const chunks = recursiveSplit(content)
  return chunks.filter(chunk => chunk.trim().length >= 50)
}

function extractFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return { frontmatter: null, content }
  }

  const frontmatterText = match[1]
  const contentWithoutFrontmatter = content.replace(match[0], '').trim()

  // Parse YAML-like frontmatter
  const frontmatter = {}
  frontmatterText.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim()
      let value = line.substring(colonIndex + 1).trim()

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }

      frontmatter[key] = value
    }
  })

  return { frontmatter, content: contentWithoutFrontmatter }
}

async function debugFile(filePath) {
  const filename = path.basename(filePath)

  console.log(`\n${'='.repeat(60)}`)
  console.log(`🔍 DEBUGGING: ${filename}`)
  console.log(`${'='.repeat(60)}`)

  // Step 1: Read original content
  const rawContent = fs.readFileSync(filePath, 'utf-8')
  console.log('\n📄 ORIGINAL CONTENT:')
  console.log('-'.repeat(40))
  console.log(rawContent)
  console.log('-'.repeat(40))

  // Step 2: Extract frontmatter
  const { frontmatter, content } = extractFrontmatter(rawContent)
  console.log('\n📋 AFTER extractFrontmatter():')
  console.log('Frontmatter:', JSON.stringify(frontmatter, null, 2))
  console.log('Content:')
  console.log('-'.repeat(40))
  console.log(content)
  console.log('-'.repeat(40))

  // Step 3: Generate chunks
  const chunks = chunkDocument(content)
  console.log(`\n✂️ CHUNKS GENERATED (${chunks.length} chunks):`)
  chunks.forEach((chunk, i) => {
    console.log(`\n--- Chunk ${i + 1} (${chunk.length} chars) ---`)
    console.log(chunk)
    console.log('--- End Chunk ---')
  })

  // Step 4: Insert into database and immediately retrieve
  console.log('\n💾 INSERTING INTO DATABASE...')

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]

    try {
      // Generate a simple embedding (just for testing)
      const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: chunk,
        encoding_format: 'float',
      })

      const insertData = {
        content: chunk,
        embedding: `[${embedding.data[0].embedding.join(',')}]`,
        source_file: filename,
        document_type: 'operational',
        chunk_index: i,
        total_chunks: chunks.length,
        embedding_model: 'text-embedding-3-large',
        language: 'es'
      }

      const { error } = await supabase
        .from('document_embeddings')
        .insert(insertData)

      if (error) {
        console.error(`❌ Error inserting chunk ${i + 1}:`, error.message)
      } else {
        console.log(`✅ Chunk ${i + 1} inserted`)
      }

    } catch (error) {
      console.error(`❌ Error processing chunk ${i + 1}:`, error.message)
    }
  }

  // Step 5: Retrieve from database to see what was actually stored
  console.log('\n🔍 RETRIEVING FROM DATABASE...')

  const { data, error } = await supabase
    .from('document_embeddings')
    .select('content, source_file, chunk_index')
    .eq('source_file', filename)
    .order('chunk_index')

  if (error) {
    console.error('❌ Error retrieving data:', error.message)
  } else {
    console.log(`\n📊 STORED IN DATABASE (${data.length} records):`)
    data.forEach((record, i) => {
      console.log(`\n--- DB Record ${i + 1} ---`)
      console.log('Source File:', record.source_file)
      console.log('Chunk Index:', record.chunk_index)
      console.log('Content:')
      console.log(record.content)
      console.log('--- End DB Record ---')
    })
  }
}

async function runDebugTests() {
  try {
    console.log('🚀 Starting embedding debug tests...')

    // Clear test records first
    console.log('\n🗑️ Clearing existing test records...')
    const { error: deleteError } = await supabase
      .from('document_embeddings')
      .delete()
      .like('source_file', 'test%')

    if (deleteError) {
      console.warn('⚠️ Warning clearing test records:', deleteError.message)
    } else {
      console.log('✅ Test records cleared')
    }

    // Test each file
    const testFiles = [
      '/tmp/embedding-tests/test1-simple.md',
      '/tmp/embedding-tests/test2-with-frontmatter.md',
      '/tmp/embedding-tests/test3-with-comments.md',
      '/tmp/embedding-tests/test4-muva-style.md'
    ]

    for (const filePath of testFiles) {
      await debugFile(filePath)

      // Small delay between files
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n🎉 Debug tests completed!')

  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

runDebugTests()