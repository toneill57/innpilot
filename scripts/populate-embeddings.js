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

  // 4. Normalize document_type (handle hyphen to underscore)
  if (normalized.document_type) {
    normalized.document_type = normalized.document_type.toLowerCase().replace('-', '_');
  }

  // 5. Remove auto-calculated fields from metadata
  delete normalized.token_count; // Will be calculated
  delete normalized.page_number; // Only for PDFs

  return normalized;
}

function determineDocumentType(filePath, frontmatter) {
  // 1. Priority: use document_type from frontmatter
  if (frontmatter?.document_type) {
    return frontmatter.document_type.toLowerCase().replace('-', '_')
  }

  // 2. Fallback: use category from frontmatter
  if (frontmatter?.category) {
    return frontmatter.category.toLowerCase()
  }

  // 3. Legacy fallback: determine by file path/name
  const filename = path.basename(filePath).toLowerCase()
  const dirPath = path.dirname(filePath).toLowerCase()

  if (filename === 'snapshot.md') return 'technical'
  if (dirPath.includes('sire') || filename.includes('sire')) return 'sire_docs'
  if (filename.includes('template')) return 'template'
  if (filename.includes('readme') || filename.includes('claude')) return 'technical'

  return 'operational'  // Default type
}

function getDocumentFiles(args) {
  const files = []

  // Parse command line arguments
  if (args.includes('--all')) {
    // Find all markdown files in the project
    const patterns = [
      'SNAPSHOT.md',
      'README.md',
      'CLAUDE.md',
      '_assets/**/*.md',
      'docs/**/*.md'
    ]

    patterns.forEach(pattern => {
      const matches = glob.sync(pattern, { cwd: projectRoot })
      matches.forEach(match => {
        files.push(path.join(projectRoot, match))
      })
    })
  } else if (args.includes('--sire-only')) {
    // Only SIRE documents
    const sireFiles = glob.sync('_assets/sire/**/*.md', { cwd: projectRoot })
    sireFiles.forEach(file => {
      files.push(path.join(projectRoot, file))
    })
  } else if (args.length > 2) {
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
    // Default: SNAPSHOT.md and SIRE docs
    const defaultFiles = [
      'SNAPSHOT.md',
      '_assets/sire/pasos-para-reportar-al-sire.md'
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

  // Determine document type using normalized frontmatter
  const documentType = determineDocumentType(filePath, frontmatter)
  console.log(`   Type: ${documentType}`)

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

      // Prepare insert data - use columns that exist in the database (from screenshot)
      const insertData = {
        content: chunk,
        embedding: `[${embedding.join(',')}]`, // Format as vector literal for pgvector
        source_file: filename,
        document_type: documentType,
        chunk_index: i,
        total_chunks: chunks.length,
        // Metadata fields that exist in the database
        title: frontmatter?.title || null,
        description: frontmatter?.description || null,
        category: frontmatter?.category || null,
        status: frontmatter?.status || null,
        version: frontmatter?.version || null,
        language: frontmatter?.language || 'es', // Already normalized with default
        embedding_model: 'text-embedding-3-large',
        // Optional fields from normalized metadata
        section_title: frontmatter?.section_title || null,
        token_count: chunk.split(/\s+/).length, // Calculate token count
        updated_at: frontmatter?.updated_at || null,
        created_at: frontmatter?.created_at || null,
        tags: frontmatter?.tags || null, // Already normalized arrays
        keywords: frontmatter?.keywords || null // Already normalized arrays
      }

      // Insert into Supabase with error handling
      const { error } = await supabase
        .from('document_embeddings')
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
    documentType,
    totalChunks: chunks.length,
    successful,
    failed,
    results
  }
}

async function populateEmbeddings() {
  try {
    // Parse command line arguments
    const args = process.argv
    const files = getDocumentFiles(args)

    if (files.length === 0) {
      console.log('❌ No files found to process')
      console.log('\nUsage:')
      console.log('  node scripts/populate-embeddings.js [options] [files...]')
      console.log('\nOptions:')
      console.log('  --all         Process all markdown files in project')
      console.log('  --sire-only   Process only SIRE documents')
      console.log('\nExamples:')
      console.log('  node scripts/populate-embeddings.js SNAPSHOT.md')
      console.log('  node scripts/populate-embeddings.js --all')
      console.log('  node scripts/populate-embeddings.js SNAPSHOT.md _assets/sire/pasos-para-reportar-al-sire.md')
      return
    }

    console.log('🚀 Starting dynamic document processing...')
    console.log(`📁 Found ${files.length} file(s) to process:`)
    files.forEach((file, i) => {
      console.log(`   ${i + 1}. ${path.relative(projectRoot, file)}`)
    })

    console.log('\n🗑️  Clearing existing embeddings...')
    const { error: deleteError } = await supabase
      .from('document_embeddings')
      .delete()
      .not('id', 'is', null) // Delete all rows with proper UUID syntax

    if (deleteError) {
      console.warn('⚠️  Warning clearing existing embeddings:', deleteError.message)
    } else {
      console.log('✅ Existing embeddings cleared')
    }

    // Process each document
    const documentResults = []
    for (const filePath of files) {
      const result = await processDocument(filePath)
      documentResults.push(result)
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('🎉 Embedding process completed!')
    console.log('='.repeat(60))

    let totalSuccessful = 0
    let totalFailed = 0
    let totalChunks = 0

    documentResults.forEach(result => {
      console.log(`📄 ${result.filename} (${result.documentType}):`)
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

    console.log('\n✅ All documents successfully processed!')

  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

// Run the script
populateEmbeddings()