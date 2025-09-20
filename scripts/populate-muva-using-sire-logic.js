import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { glob } from 'glob'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.dirname(__dirname)

// Load environment variables
config({ path: '.env.local' })

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key to bypass RLS
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

  // Improved recursive character text splitter with better separator hierarchy
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

      // If we don't exceed the text length, take everything
      if (end >= text.length) {
        chunks.push(text.substring(start))
        break
      }

      // Find the best split point by looking backwards from the chunk limit
      let splitPoint = -1

      for (const separator of separators) {
        if (separator === '') {
          // Last resort: split at exact position
          splitPoint = end
          break
        }

        // Find the last occurrence of this separator before our limit
        const lastIndex = text.lastIndexOf(separator, end)

        // Only use this split point if it's reasonably far into the chunk
        // (at least 50% of chunk size to avoid tiny chunks)
        if (lastIndex > start + CHUNK_SIZE / 2) {
          splitPoint = lastIndex + separator.length
          break
        }
      }

      // If no good split point found, split at exact limit
      if (splitPoint === -1) {
        splitPoint = end
      }

      // Add the chunk
      chunks.push(text.substring(start, splitPoint))

      // Move to next chunk with overlap
      start = Math.max(splitPoint - OVERLAP, start + 1)
    }

    return chunks
  }

  const chunks = recursiveSplit(content)

  // Filter out very small chunks (less than 50 characters)
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

      // Remove comments (everything after #)
      const commentIndex = value.indexOf('#')
      if (commentIndex >= 0) {
        value = value.substring(0, commentIndex).trim()
      }

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

function mapBusinessTypeToCategory(businessType) {
  const mapping = {
    'Spot': 'attraction',
    'Restaurante': 'restaurant',
    'Actividad': 'activity',
    'Night Life': 'nightlife',
    'Alquiler': 'transport'
  }

  return mapping[businessType] || 'attraction' // Default to attraction
}

function normalizeMetadata(frontmatter) {
  if (!frontmatter) return frontmatter;

  const normalized = { ...frontmatter };

  // 1. Normalize timestamps to ISO format
  ['updated_at', 'created_at'].forEach(field => {
    if (normalized[field]) {
      const timestamp = normalized[field];
      // If it's already ISO format, keep it
      if (timestamp.includes('T')) {
        normalized[field] = timestamp;
      } else {
        // Convert "YYYY-MM-DD HH:MM:SS" to ISO format
        normalized[field] = new Date(timestamp).toISOString();
      }
    }
  });

  // 2. Ensure arrays are properly formatted
  ['tags', 'keywords'].forEach(field => {
    if (normalized[field]) {
      if (Array.isArray(normalized[field])) {
        // Clean up array elements
        normalized[field] = normalized[field].map(item =>
          typeof item === 'string' ? item.trim().replace(/"/g, '') : item
        );
      } else if (typeof normalized[field] === 'string') {
        // Convert string to array if needed
        normalized[field] = normalized[field]
          .split(',')
          .map(item => item.trim().replace(/"/g, ''));
      }
    }
  });

  // 3. Set default language if not specified
  if (!normalized.language) {
    normalized.language = 'es';
  }

  return normalized;
}

function getDocumentFiles(args) {
  const files = []

  // Parse command line arguments
  if (args.length > 2) {
    // Specific files provided as arguments
    for (let i = 2; i < args.length; i++) {
      const filePath = args[i]
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(projectRoot, filePath)
      if (fs.existsSync(fullPath)) {
        files.push(fullPath)
      } else {
        console.warn(`⚠️  File not found: ${filePath}`)
      }
    }
  } else {
    // Default: MUVA test files
    const defaultFiles = [
      '_assets/muva/listings/spot/big-mama.md',
      '_assets/muva/listings/restaurante/bali-smoothies.md',
      '_assets/muva/listings/actividad/yoga-san-andres.md'
    ]

    defaultFiles.forEach(file => {
      const fullPath = path.join(projectRoot, file)
      if (fs.existsSync(fullPath)) {
        files.push(fullPath)
      } else {
        console.warn(`⚠️  Default file not found: ${file}`)
      }
    })
  }

  return [...new Set(files)] // Remove duplicates
}

async function processDocument(filePath) {
  const filename = path.basename(filePath)

  console.log(`\n📄 Processing: ${filename}`)
  console.log(`   Path: ${path.relative(projectRoot, filePath)}`)

  // Read the document
  const rawContent = fs.readFileSync(filePath, 'utf-8')

  // Extract frontmatter metadata
  const { frontmatter: rawFrontmatter, content } = extractFrontmatter(rawContent)

  // Normalize metadata for better compatibility
  const frontmatter = normalizeMetadata(rawFrontmatter)

  console.log(`   Type: muva`)

  if (frontmatter) {
    console.log('📋 Frontmatter metadata:')
    Object.keys(frontmatter).slice(0, 3).forEach(key => {
      const value = Array.isArray(frontmatter[key]) ? frontmatter[key].join(', ') : frontmatter[key]
      console.log(`   ${key}: ${String(value).substring(0, 60)}${String(value).length > 60 ? '...' : ''}`)
    })
  }

  // Chunk the document
  const chunks = chunkDocument(content)
  console.log(`📋 Document split into ${chunks.length} chunks`)

  // Process each chunk
  const results = []
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    console.log(`   ⚙️  Processing chunk ${i + 1}/${chunks.length}...`)

    try {
      // Generate embedding
      const embedding = await generateEmbedding(chunk)

      // Generate ID as text (not UUID like document_embeddings)
      const chunkId = `${filename.replace('.md', '')}_chunk_${i}`

      // Map business type to category
      const mappedCategory = mapBusinessTypeToCategory(frontmatter?.business_type)

      // Prepare insert data for muva_embeddings table
      const insertData = {
        id: chunkId,
        content: chunk,
        embedding: `[${embedding.join(',')}]`, // Format as vector literal for pgvector
        title: frontmatter?.name || null,
        description: frontmatter?.description || null,
        category: mappedCategory || null,
        location: frontmatter?.location?.zone || null,
        city: "San Andrés",
        rating: 4.0, // Default rating
        price_range: '$', // Default price range
        source_file: filename,
        chunk_index: i,
        total_chunks: chunks.length,
        opening_hours: frontmatter?.business_hours?.schedule || null,
        contact_info: frontmatter?.contact || null,
        tags: frontmatter?.tags || null,
        language: frontmatter?.language || 'es',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Insert into Supabase with error handling
      const { error } = await supabase
        .from('muva_embeddings')
        .insert(insertData)

      if (error) {
        console.error(`   ❌ Error inserting chunk ${i + 1}:`, error.message)
        results.push({ success: false, error: error.message })
      } else {
        console.log(`   ✅ Chunk ${i + 1} inserted successfully`)
        results.push({ success: true })
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      console.error(`   ❌ Error processing chunk ${i + 1}:`, error.message)
      results.push({ success: false, error: error.message })
    }
  }

  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  console.log(`📊 Document processing complete: ${successful} successful, ${failed} failed`)

  return {
    filename,
    totalChunks: chunks.length,
    successful,
    failed,
    results
  }
}

async function populateMuvaEmbeddings() {
  try {
    // Parse command line arguments
    const args = process.argv
    const files = getDocumentFiles(args)

    if (files.length === 0) {
      console.log('❌ No files found to process')
      console.log('\nUsage:')
      console.log('  node scripts/populate-muva-using-sire-logic.js [files...]')
      console.log('\nExamples:')
      console.log('  node scripts/populate-muva-using-sire-logic.js')
      console.log('  node scripts/populate-muva-using-sire-logic.js _assets/muva/listings/spot/big-mama.md')
      return
    }

    console.log('🚀 Starting MUVA document processing using SIRE logic...')
    console.log(`📁 Found ${files.length} file(s) to process:`)
    files.forEach((file, i) => {
      console.log(`   ${i + 1}. ${path.relative(projectRoot, file)}`)
    })

    console.log('\n🗑️  Clearing existing MUVA embeddings...')
    const { error: deleteError } = await supabase
      .from('muva_embeddings')
      .delete()
      .not('id', 'is', null) // Delete all rows

    if (deleteError) {
      console.warn('⚠️  Warning clearing existing embeddings:', deleteError.message)
    } else {
      console.log('✅ Existing MUVA embeddings cleared')
    }

    // Process each document
    const documentResults = []
    for (const filePath of files) {
      const result = await processDocument(filePath)
      documentResults.push(result)
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('🎉 MUVA embedding process completed!')
    console.log('='.repeat(60))

    let totalSuccessful = 0
    let totalFailed = 0
    let totalChunks = 0

    documentResults.forEach(result => {
      console.log(`📄 ${result.filename}:`)
      console.log(`   Chunks: ${result.totalChunks}, Successful: ${result.successful}, Failed: ${result.failed}`)
      totalSuccessful += result.successful
      totalFailed += result.failed
      totalChunks += result.totalChunks
    })

    console.log('\n📊 Overall Summary:')
    console.log(`   Total documents: ${documentResults.length}`)
    console.log(`   Total chunks: ${totalChunks}`)
    console.log(`   Successful embeddings: ${totalSuccessful}`)
    console.log(`   Failed embeddings: ${totalFailed}`)
    console.log(`   Success rate: ${((totalSuccessful / totalChunks) * 100).toFixed(1)}%`)

    console.log('\n✅ All MUVA documents successfully processed!')

  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

// Run the script
populateMuvaEmbeddings()