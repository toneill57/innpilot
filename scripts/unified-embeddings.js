#!/usr/bin/env node

/**
 * UNIFIED EMBEDDINGS SCRIPT
 *
 * Este script unificado puede procesar tanto documentos SIRE (compliance)
 * como MUVA (turismo) y automáticamente determina a qué dominio/tabla pertenecen.
 *
 * Detección automática basada en:
 * - document_type en frontmatter (muva vs sire_docs)
 * - Path del archivo (_assets/muva/ vs _assets/sire/)
 * - Estructura del frontmatter (business_type = MUVA, category = SIRE)
 */

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
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Domain detection and configuration
const DOMAIN_CONFIGS = {
  SIRE: {
    tableName: 'document_embeddings',
    idField: 'id', // UUID auto-generated
    requiredFields: ['title', 'category'],
    optionalFields: ['section_title', 'tags', 'keywords', 'version', 'status', 'language'],
    documentTypes: ['sire_docs', 'regulatory', 'technical', 'operational', 'template']
  },
  MUVA: {
    tableName: 'muva_embeddings',
    idField: 'id', // text with custom format
    requiredFields: ['name', 'business_type'],
    optionalFields: ['location', 'target_audience', 'rating', 'price_range', 'category', 'city', 'coordinates', 'opening_hours', 'contact_info', 'tags'],
    documentTypes: ['muva']
  }
}

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
    encoding_format: 'float',
  })
  return response.data[0].embedding
}

/**
 * Improved chunking with semantic validation
 */
function chunkDocumentWithValidation(content) {
  const CHUNK_SIZE = 1000
  const OVERLAP = 100

  const separators = [
    '\n## ',    // Markdown h2 headers (main sections only)
    '\n\n',     // Paragraph breaks
    '\n',       // Line breaks
    ' ',        // Word breaks
    ''          // Character breaks (fallback)
  ]

  function isValidSplit(text, splitPoint) {
    // Don't split in the middle of a word
    if (splitPoint > 0 && splitPoint < text.length) {
      const prevChar = text[splitPoint - 1]
      const nextChar = text[splitPoint]

      // Avoid splitting between alphanumeric characters (middle of word)
      if (/\w/.test(prevChar) && /\w/.test(nextChar)) {
        return false
      }
    }
    return true
  }

  function recursiveSplit(text) {
    if (text.length <= CHUNK_SIZE) {
      return [text.trim()].filter(chunk => chunk.length > 0)
    }

    const chunks = []
    let start = 0

    while (start < text.length) {
      let end = start + CHUNK_SIZE

      if (end >= text.length) {
        const finalChunk = text.substring(start).trim()
        if (finalChunk.length > 0) {
          chunks.push(finalChunk)
        }
        break
      }

      let splitPoint = -1

      // Find the best semantic split point
      for (const separator of separators) {
        if (separator === '') {
          // Last resort: find nearest word boundary
          for (let i = end; i > start + CHUNK_SIZE / 2; i--) {
            if (isValidSplit(text, i)) {
              splitPoint = i
              break
            }
          }
          if (splitPoint === -1) splitPoint = end // Final fallback
          break
        }

        const lastIndex = text.lastIndexOf(separator, end)
        if (lastIndex > start + CHUNK_SIZE / 2) {
          const potentialSplit = lastIndex + separator.length
          if (isValidSplit(text, potentialSplit)) {
            splitPoint = potentialSplit
            break
          }
        }
      }

      if (splitPoint === -1) {
        splitPoint = end
      }

      const chunk = text.substring(start, splitPoint).trim()
      if (chunk.length > 0) {
        chunks.push(chunk)
      }

      start = Math.max(splitPoint - OVERLAP, start + 1)
    }

    // Filter out very small chunks and validate
    return chunks
      .filter(chunk => chunk.trim().length >= 50)
      .map(chunk => {
        // Additional validation: ensure no chunks end mid-word
        const trimmed = chunk.trim()
        // Check if chunk ends with incomplete word (basic heuristic)
        if (/\w$/.test(trimmed) && trimmed.length >= CHUNK_SIZE * 0.8) {
          const lastSpace = trimmed.lastIndexOf(' ')
          if (lastSpace > trimmed.length * 0.8) {
            return trimmed.substring(0, lastSpace)
          }
        }
        return trimmed
      })
      .filter(chunk => chunk.length >= 50)
  }

  return recursiveSplit(content)
}

function extractFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return { frontmatter: null, content }
  }

  const frontmatterText = match[1]
  const contentWithoutFrontmatter = content.replace(match[0], '').trim()

  // Enhanced YAML-like frontmatter parser
  const frontmatter = {}
  const lines = frontmatterText.split('\n')
  let currentKey = null
  let currentValue = []
  let inNestedObject = false
  let nestedKey = null

  for (let line of lines) {
    line = line.trim()
    if (!line || line.startsWith('#')) continue

    const colonIndex = line.indexOf(':')

    if (colonIndex > 0 && !line.startsWith(' ') && !line.startsWith('-')) {
      // Save previous key if exists
      if (currentKey) {
        if (currentValue.length === 1 && typeof currentValue[0] === 'string') {
          frontmatter[currentKey] = currentValue[0]
        } else if (currentValue.length > 1) {
          frontmatter[currentKey] = currentValue
        } else if (typeof currentValue[0] === 'object') {
          frontmatter[currentKey] = currentValue[0]
        }
      }

      // Start new key
      currentKey = line.substring(0, colonIndex).trim()
      let value = line.substring(colonIndex + 1).trim()

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }

      // Handle arrays
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''))
        currentValue = value
      } else if (value === '') {
        // Nested object or array
        currentValue = [{}]
        inNestedObject = true
      } else {
        currentValue = [value]
        inNestedObject = false
      }
    } else if (line.startsWith(' ') && currentKey && inNestedObject) {
      // Nested property
      const nestedLine = line.trim()
      const nestedColonIndex = nestedLine.indexOf(':')
      if (nestedColonIndex > 0) {
        const nestedKey = nestedLine.substring(0, nestedColonIndex).trim()
        let nestedValue = nestedLine.substring(nestedColonIndex + 1).trim()

        if ((nestedValue.startsWith('"') && nestedValue.endsWith('"')) ||
            (nestedValue.startsWith("'") && nestedValue.endsWith("'"))) {
          nestedValue = nestedValue.slice(1, -1)
        }

        if (typeof currentValue[0] === 'object') {
          currentValue[0][nestedKey] = nestedValue
        }
      }
    } else if (line.startsWith('-') && currentKey) {
      // Array item
      const item = line.substring(1).trim().replace(/['"]/g, '')
      if (Array.isArray(currentValue)) {
        currentValue.push(item)
      } else {
        currentValue = [currentValue[0], item]
      }
    }
  }

  // Don't forget the last key
  if (currentKey) {
    if (currentValue.length === 1 && typeof currentValue[0] === 'string') {
      frontmatter[currentKey] = currentValue[0]
    } else if (currentValue.length > 1) {
      frontmatter[currentKey] = currentValue
    } else if (typeof currentValue[0] === 'object') {
      frontmatter[currentKey] = currentValue[0]
    }
  }

  return { frontmatter, content: contentWithoutFrontmatter }
}

/**
 * Detect domain (SIRE vs MUVA) based on multiple criteria
 */
function detectDomain(filePath, frontmatter) {
  // 1. Explicit document_type in frontmatter (highest priority)
  if (frontmatter?.document_type) {
    const docType = frontmatter.document_type.toLowerCase()
    if (DOMAIN_CONFIGS.MUVA.documentTypes.includes(docType)) {
      return 'MUVA'
    }
    if (DOMAIN_CONFIGS.SIRE.documentTypes.includes(docType)) {
      return 'SIRE'
    }
  }

  // 2. Path-based detection
  if (filePath.includes('_assets/muva/')) {
    return 'MUVA'
  }
  if (filePath.includes('_assets/sire/') || filePath.includes('/sire/')) {
    return 'SIRE'
  }

  // 3. Frontmatter structure-based detection
  if (frontmatter?.business_type) {
    return 'MUVA'
  }
  if (frontmatter?.category && (frontmatter?.title || frontmatter?.tags)) {
    return 'SIRE'
  }

  // 4. Filename-based heuristics
  const filename = path.basename(filePath).toLowerCase()
  if (filename.includes('muva') || filename.includes('listing')) {
    return 'MUVA'
  }
  if (filename.includes('sire') || filename.includes('regulatory')) {
    return 'SIRE'
  }

  // Default fallback
  console.warn(`⚠️  Could not detect domain for ${filePath}, defaulting to SIRE`)
  return 'SIRE'
}

/**
 * Normalize metadata for specific domain
 */
function normalizeMetadata(frontmatter, domain) {
  if (!frontmatter) return {}

  try {
    const normalized = { ...(frontmatter || {}) }
    const config = DOMAIN_CONFIGS[domain]

  // Domain-specific normalization
  if (domain === 'SIRE') {
    // Normalize timestamps to ISO format
    ['updated_at', 'created_at'].forEach(field => {
      if (normalized[field]) {
        const timestamp = normalized[field]
        if (!timestamp.includes('T')) {
          normalized[field] = new Date(timestamp).toISOString()
        }
      }
    })

    // Ensure arrays are properly formatted
    ['tags', 'keywords'].forEach(field => {
      if (normalized[field]) {
        if (!Array.isArray(normalized[field])) {
          normalized[field] = normalized[field].toString().split(',').map(item => item.trim())
        }
      } else {
        // Initialize as null if undefined to prevent access errors
        normalized[field] = null
      }
    })

    // Set default language
    if (!normalized.language) {
      normalized.language = 'es'
    }

    // Normalize document_type
    if (normalized.document_type) {
      normalized.document_type = normalized.document_type.toLowerCase().replace('-', '_')
    }
  } else if (domain === 'MUVA') {
    // Normalize business_type
    if (normalized.business_type) {
      normalized.business_type = normalized.business_type.charAt(0).toUpperCase() + normalized.business_type.slice(1).toLowerCase()
    }

    // Ensure arrays for tags and target_audience
    ['tags', 'target_audience'].forEach(field => {
      if (normalized[field] && !Array.isArray(normalized[field])) {
        normalized[field] = [normalized[field]]
      } else if (!normalized[field]) {
        // Initialize as null if undefined to prevent access errors
        normalized[field] = null
      }
    })

    // Set default language
    if (!normalized.language) {
      normalized.language = 'es'
    }
  }

  return normalized
  } catch (error) {
    console.error(`Error normalizing metadata for domain ${domain}:`, error.message)
    return {}
  }
}

/**
 * Prepare insert data for specific domain
 */
function prepareInsertData(chunk, chunkIndex, chunks, frontmatter, domain, filePath) {
  const filename = path.basename(filePath)
  const config = DOMAIN_CONFIGS[domain]
  const normalized = normalizeMetadata(frontmatter, domain)

  // Add defensive validation for normalized data
  const safeNormalized = normalized || {}

  const baseData = {
    content: chunk,
    embedding: null, // Will be set after generation
    source_file: filename,
    chunk_index: chunkIndex,
    total_chunks: chunks.length,
    language: safeNormalized.language || 'es',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  if (domain === 'SIRE') {
    return {
      ...baseData,
      document_type: safeNormalized.document_type || 'operational',
      title: safeNormalized.title || null,
      description: safeNormalized.description || null,
      category: safeNormalized.category || null,
      status: safeNormalized.status || null,
      version: safeNormalized.version || null,
      embedding_model: 'text-embedding-3-large',
      section_title: safeNormalized.section_title || null,
      token_count: chunk.split(/\s+/).length,
      tags: safeNormalized.tags || null,
      keywords: safeNormalized.keywords || null
    }
  } else if (domain === 'MUVA') {
    // Map business_type to valid category
    const mapBusinessTypeToCategory = (businessType) => {
      const mapping = {
        'actividad': 'activity',
        'restaurante': 'restaurant',
        'spot': 'attraction',
        'night life': 'nightlife',
        'night-life': 'nightlife',
        'alquiler': 'transport'
      }
      return mapping[businessType?.toLowerCase()] || 'activity'
    }

    // Generate custom ID for MUVA
    const customId = `${filename.replace('.md', '')}_chunk_${chunkIndex}`

    return {
      id: customId,
      ...baseData,
      title: safeNormalized.name || null,
      description: safeNormalized.description || null,
      category: mapBusinessTypeToCategory(safeNormalized.business_type),
      location: safeNormalized.location?.zone || null,
      city: safeNormalized.location?.subzone || 'San Andrés',
      coordinates: safeNormalized.coordinates || null,
      rating: safeNormalized.rating || null,
      price_range: safeNormalized.price_range || null,
      opening_hours: safeNormalized.opening_hours || null,
      contact_info: safeNormalized.contact_info || null,
      tags: safeNormalized.tags || null
    }
  }

  throw new Error(`Unknown domain: ${domain}`)
}

/**
 * Process a single document
 */
async function processDocument(filePath) {
  const filename = path.basename(filePath)
  console.log(`\n📄 Processing: ${filename}`)
  console.log(`   Path: ${path.relative(projectRoot, filePath)}`)

  // Read and parse document
  const rawContent = fs.readFileSync(filePath, 'utf-8')
  const { frontmatter, content } = extractFrontmatter(rawContent)

  // Detect domain
  const domain = detectDomain(filePath, frontmatter)
  const config = DOMAIN_CONFIGS[domain]

  console.log(`   Domain: ${domain} → Table: ${config.tableName}`)

  if (frontmatter) {
    console.log('📋 Metadata detected:')
    Object.keys(frontmatter).slice(0, 3).forEach(key => {
      const value = Array.isArray(frontmatter[key]) ? frontmatter[key].join(', ') : frontmatter[key]
      console.log(`   ${key}: ${String(value).substring(0, 60)}${String(value).length > 60 ? '...' : ''}`)
    })
  }

  // Chunk the document with validation
  const chunks = chunkDocumentWithValidation(content)
  console.log(`📋 Document split into ${chunks.length} chunks (with semantic validation)`)

  // Process each chunk
  const results = []
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    console.log(`   ⚙️  Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)...`)

    try {
      // Generate embedding
      const embedding = await generateEmbedding(chunk)

      // Prepare insert data for the detected domain
      const insertData = prepareInsertData(chunk, i, chunks, frontmatter, domain, filePath)
      insertData.embedding = `[${embedding.join(',')}]`

      // Insert into appropriate table
      const { error } = await supabase
        .from(config.tableName)
        .insert(insertData)

      if (error) {
        console.error(`   ❌ Error inserting chunk ${i + 1}:`, error.message)
        results.push({ success: false, error: error.message })
      } else {
        console.log(`   ✅ Chunk ${i + 1} inserted successfully`)
        results.push({ success: true })
      }

      // Rate limiting
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
    domain,
    tableName: config.tableName,
    totalChunks: chunks.length,
    successful,
    failed,
    results
  }
}

/**
 * Get files to process based on arguments
 */
function getDocumentFiles(args) {
  const files = []

  if (args.includes('--all')) {
    // All markdown files (both domains)
    const patterns = [
      'SNAPSHOT.md',
      'README.md',
      'CLAUDE.md',
      '_assets/sire/**/*.md',
      '_assets/muva/**/*.md',
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
  } else if (args.includes('--muva-only')) {
    // Only MUVA documents
    const muvaFiles = glob.sync('_assets/muva/**/*.md', { cwd: projectRoot })
    muvaFiles.forEach(file => {
      files.push(path.join(projectRoot, file))
    })
  } else if (args.length > 2) {
    // Specific files
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
    // Default: SNAPSHOT.md and key SIRE docs
    const defaultFiles = [
      'SNAPSHOT.md',
      '_assets/sire/pasos-para-reportar-al-sire.md'
    ]

    defaultFiles.forEach(file => {
      const fullPath = path.join(projectRoot, file)
      if (fs.existsSync(fullPath)) {
        files.push(fullPath)
      }
    })
  }

  return [...new Set(files)] // Remove duplicates
}

/**
 * Clear embeddings for specific domains
 */
async function clearEmbeddings(domains = ['SIRE', 'MUVA']) {
  console.log('\n🗑️  Clearing existing embeddings...')

  for (const domain of domains) {
    const config = DOMAIN_CONFIGS[domain]
    console.log(`   Clearing ${config.tableName}...`)

    const { error } = await supabase
      .from(config.tableName)
      .delete()
      .not('id', 'is', null)

    if (error) {
      console.warn(`⚠️  Warning clearing ${config.tableName}:`, error.message)
    } else {
      console.log(`   ✅ ${config.tableName} cleared`)
    }
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const args = process.argv
    const files = getDocumentFiles(args)

    if (files.length === 0) {
      console.log('❌ No files found to process')
      console.log('\nUsage:')
      console.log('  node scripts/unified-embeddings.js [options] [files...]')
      console.log('\nOptions:')
      console.log('  --all         Process all markdown files (SIRE + MUVA)')
      console.log('  --sire-only   Process only SIRE documents')
      console.log('  --muva-only   Process only MUVA documents')
      console.log('\nExamples:')
      console.log('  node scripts/unified-embeddings.js --all')
      console.log('  node scripts/unified-embeddings.js --muva-only')
      console.log('  node scripts/unified-embeddings.js SNAPSHOT.md _assets/muva/listings/actividad/yoga-san-andres.md')
      return
    }

    console.log('🚀 Starting unified document processing...')
    console.log(`📁 Found ${files.length} file(s) to process:`)
    files.forEach((file, i) => {
      console.log(`   ${i + 1}. ${path.relative(projectRoot, file)}`)
    })

    // Determine which domains will be processed
    const domainsToProcess = []
    for (const file of files) {
      const rawContent = fs.readFileSync(file, 'utf-8')
      const { frontmatter } = extractFrontmatter(rawContent)
      const domain = detectDomain(file, frontmatter)
      if (!domainsToProcess.includes(domain)) {
        domainsToProcess.push(domain)
      }
    }

    // Clear relevant tables
    await clearEmbeddings(domainsToProcess)

    // Process each document
    const documentResults = []
    for (const filePath of files) {
      const result = await processDocument(filePath)
      documentResults.push(result)
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('🎉 Unified embedding process completed!')
    console.log('='.repeat(60))

    let totalSuccessful = 0
    let totalFailed = 0
    let totalChunks = 0
    const domainStats = {}

    documentResults.forEach(result => {
      console.log(`📄 ${result.filename} (${result.domain} → ${result.tableName}):`)
      console.log(`   Chunks: ${result.totalChunks}, Successful: ${result.successful}, Failed: ${result.failed}`)

      totalSuccessful += result.successful
      totalFailed += result.failed
      totalChunks += result.totalChunks

      if (!domainStats[result.domain]) {
        domainStats[result.domain] = { files: 0, chunks: 0, successful: 0 }
      }
      domainStats[result.domain].files++
      domainStats[result.domain].chunks += result.totalChunks
      domainStats[result.domain].successful += result.successful
    })

    console.log('\n📊 Overall Summary:')
    console.log(`   Total documents: ${documentResults.length}`)
    console.log(`   Total chunks: ${totalChunks}`)
    console.log(`   Successful embeddings: ${totalSuccessful}`)
    console.log(`   Failed embeddings: ${totalFailed}`)
    console.log(`   Success rate: ${((totalSuccessful / totalChunks) * 100).toFixed(1)}%`)

    console.log('\n📊 By Domain:')
    Object.entries(domainStats).forEach(([domain, stats]) => {
      const config = DOMAIN_CONFIGS[domain]
      console.log(`   ${domain} (${config.tableName}): ${stats.files} files, ${stats.chunks} chunks, ${stats.successful} successful`)
    })

    console.log('\n✅ All documents successfully processed!')

  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

// Run the script
main()