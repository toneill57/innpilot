import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { glob } from 'glob'
import { chunkText } from '../src/lib/chunking.ts'

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

async function chunkDocument(content) {
  // Use the optimized SemanticChunker from chunking.ts
  return await chunkText(content, 1000, 100)
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
      let timestamp = normalized[field];

      // Clean up value: remove comments and extra quotes
      if (typeof timestamp === 'string') {
        timestamp = timestamp.replace(/\s*#.*$/, '').trim(); // Remove comments
        timestamp = timestamp.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
      }

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
  // 1. Detect MUVA documents by path
  if (filePath.includes('_assets/muva') || filePath.includes('/muva/')) {
    return 'muva'
  }

  // 2. Detect MUVA documents by business_type in frontmatter
  if (frontmatter?.business_type) {
    return 'muva'
  }

  // 3. Priority: use document_type from frontmatter
  if (frontmatter?.document_type) {
    let docType = frontmatter.document_type
    // Clean up value: remove comments and extra quotes
    if (typeof docType === 'string') {
      docType = docType.replace(/\s*#.*$/, '').trim() // Remove comments
      docType = docType.replace(/^["']|["']$/g, '') // Remove surrounding quotes
    }
    return docType.toLowerCase().replace('-', '_')
  }

  // 4. Fallback: use category from frontmatter
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
  const chunks = await chunkDocument(content)
  console.log(`📋 Document split into ${chunks.length} chunks`)

  // Process each chunk
  const results = []
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    console.log(`   ⚙️  Processing chunk ${i + 1}/${chunks.length}...`)

    try {
      // Generate embedding
      const embedding = await generateEmbedding(chunk)

      // Prepare insert data based on table schema
      let insertData

      if (documentType === 'muva') {
        // Map business_type to valid category values
        const businessTypeMap = {
          'actividad': 'activity',
          'restaurante': 'restaurant',
          'spot': 'attraction',
          'night life': 'nightlife',
          'alquiler': 'shopping'
        }

        const businessType = frontmatter?.business_type?.toLowerCase() || ''
        const mappedCategory = businessTypeMap[businessType] || frontmatter?.category || 'activity'

        // muva_embeddings table fields
        insertData = {
          content: chunk,
          embedding: `[${embedding.join(',')}]`, // Format as vector literal for pgvector
          source_file: filename,
          chunk_index: i,
          total_chunks: chunks.length,
          title: frontmatter?.name || frontmatter?.title || null, // Use 'name' from muva docs
          description: frontmatter?.description || null,
          category: mappedCategory,
          location: frontmatter?.location?.zone || frontmatter?.location || null,
          city: frontmatter?.location?.city || 'San Andrés',
          tags: frontmatter?.tags || null,
          language: frontmatter?.language || 'es',
          created_at: frontmatter?.created_at || null,
          updated_at: frontmatter?.updated_at || null
        }
      } else {
        // document_embeddings table fields
        insertData = {
          content: chunk,
          embedding: `[${embedding.join(',')}]`, // Format as vector literal for pgvector
          source_file: filename,
          document_type: documentType,
          chunk_index: i,
          total_chunks: chunks.length,
          title: frontmatter?.title || null,
          description: frontmatter?.description || null,
          category: frontmatter?.category || null,
          status: frontmatter?.status || null,
          version: frontmatter?.version || null,
          language: frontmatter?.language || 'es',
          embedding_model: 'text-embedding-3-large',
          section_title: frontmatter?.section_title || null,
          token_count: chunk.split(/\s+/).length, // Calculate token count
          updated_at: frontmatter?.updated_at || null,
          created_at: frontmatter?.created_at || null,
          tags: frontmatter?.tags || null,
          keywords: frontmatter?.keywords || null
        }
      }

      // Insert into appropriate table based on document type
      const tableName = documentType === 'muva' ? 'muva_embeddings' : 'document_embeddings'
      const { error } = await supabase
        .from(tableName)
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

    // Detect document types to determine which tables to clear
    const hasmuvaFiles = files.some(file => file.includes('muva') || file.includes('_assets/muva'))
    const hasSireFiles = files.some(file => !file.includes('muva') && !file.includes('_assets/muva'))

    // Clear muva_embeddings if processing MUVA files
    if (hasmuvaFiles) {
      const { error: deleteMuvaError } = await supabase
        .from('muva_embeddings')
        .delete()
        .not('id', 'is', null)

      if (deleteMuvaError) {
        console.warn('⚠️  Warning clearing muva embeddings:', deleteMuvaError.message)
      }
    }

    // Clear document_embeddings if processing SIRE files
    if (hasSireFiles) {
      const { error: deleteError } = await supabase
        .from('document_embeddings')
        .delete()
        .not('id', 'is', null)

      if (deleteError) {
        console.warn('⚠️  Warning clearing document embeddings:', deleteError.message)
      }
    }

    console.log('✅ Existing embeddings cleared')

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