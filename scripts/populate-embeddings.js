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
  process.env.SUPABASE_ANON_KEY
)

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
    encoding_format: 'float',
  })
  return response.data[0].embedding
}

function chunkDocument(content) {
  const CHUNK_SIZE = 1000
  const OVERLAP = 100

  // Recursive character text splitter with separators
  const separators = [
    '\n\n',    // Double newline (paragraphs)
    '\n',      // Single newline
    '. ',      // Sentences
    '? ',      // Questions
    '! ',      // Exclamations
    '; ',      // Semicolons
    ', ',      // Commas
    ' ',       // Spaces
    ''         // Characters (last resort)
  ]

  function recursiveSplit(text, separators) {
    if (text.length <= CHUNK_SIZE) {
      return [text]
    }

    // Try each separator in order
    for (const separator of separators) {
      if (text.includes(separator)) {
        const parts = text.split(separator)
        const chunks = []
        let currentChunk = ''

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i] + (i < parts.length - 1 ? separator : '')

          // If adding this part would exceed chunk size
          if (currentChunk.length + part.length > CHUNK_SIZE && currentChunk.length > 0) {
            chunks.push(currentChunk.trim())

            // Start new chunk with overlap from previous chunk
            const overlapText = currentChunk.slice(-OVERLAP)
            currentChunk = overlapText + part
          } else {
            currentChunk += part
          }
        }

        // Add the last chunk if it has content
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim())
        }

        return chunks
      }
    }

    // Fallback: split by character count if no separators found
    const chunks = []
    for (let i = 0; i < text.length; i += CHUNK_SIZE - OVERLAP) {
      const chunk = text.slice(i, i + CHUNK_SIZE)
      if (chunk.trim()) {
        chunks.push(chunk.trim())
      }
    }
    return chunks
  }

  const chunks = recursiveSplit(content, separators)

  // Filter out very small chunks (less than 50 characters)
  return chunks.filter(chunk => chunk.length >= 50)
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

      // Parse arrays
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(v => v.trim())
      }

      frontmatter[key] = value
    }
  })

  return { frontmatter, content: contentWithoutFrontmatter }
}

async function populateEmbeddings() {
  try {
    console.log('🚀 Starting SIRE document processing...')

    // Read the document
    const documentPath = path.join(__dirname, '../_assets/sire/pasos-para-reportar-al-sire.md')
    const rawContent = fs.readFileSync(documentPath, 'utf-8')

    console.log('📄 Document loaded successfully')

    // Extract frontmatter metadata
    const { frontmatter, content } = extractFrontmatter(rawContent)

    if (frontmatter) {
      console.log('📋 Frontmatter metadata extracted:')
      Object.keys(frontmatter).forEach(key => {
        console.log(`   ${key}: ${Array.isArray(frontmatter[key]) ? frontmatter[key].join(', ') : frontmatter[key]}`)
      })
    }

    // Chunk the document
    const chunks = chunkDocument(content)
    console.log(`📋 Document split into ${chunks.length} chunks`)

    // Clear existing SIRE documents (optional)
    const { error: deleteError } = await supabase
      .from('document_embeddings')
      .delete()
      .like('content', '%SIRE%')

    if (deleteError) {
      console.warn('⚠️  Warning clearing existing SIRE docs:', deleteError.message)
    } else {
      console.log('🗑️  Cleared existing SIRE documents')
    }

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      console.log(`⚙️  Processing chunk ${i + 1}/${chunks.length}...`)

      try {
        // Generate embedding
        const embedding = await generateEmbedding(chunk)

        // Insert into Supabase with all required fields and frontmatter metadata
        const { error } = await supabase
          .from('document_embeddings')
          .insert({
            content: chunk,
            embedding: embedding,
            source_file: 'pasos-para-reportar-al-sire.md',
            document_type: 'sire_docs',
            chunk_index: i,
            total_chunks: chunks.length,
            // Add frontmatter metadata if available
            document_title: frontmatter?.title || null,
            document_description: frontmatter?.description || null,
            document_category: frontmatter?.category || null,
            document_status: frontmatter?.status || null,
            document_version: frontmatter?.version || null,
            document_last_updated: frontmatter?.last_updated || null,
            document_tags: frontmatter?.tags ? JSON.stringify(frontmatter.tags) : null,
            document_keywords: frontmatter?.keywords ? JSON.stringify(frontmatter.keywords) : null,
            language: 'es',
            embedding_model: 'text-embedding-3-large'
          })

        if (error) {
          console.error(`❌ Error inserting chunk ${i + 1}:`, error.message)
        } else {
          console.log(`✅ Chunk ${i + 1} inserted successfully`)
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`❌ Error processing chunk ${i + 1}:`, error.message)
      }
    }

    console.log('🎉 SIRE document processing completed!')
    console.log('✅ All documents successfully uploaded to Supabase with embeddings!')

  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

// Run the script
populateEmbeddings()