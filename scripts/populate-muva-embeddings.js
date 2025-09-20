#!/usr/bin/env node

// MUVA Tourism Embeddings Population Script
// Loads tourism content for San Andrés and Colombian destinations into muva_embeddings table

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import fs from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Initialize clients
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const openaiApiKey = process.env.OPENAI_API_KEY

if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const openai = new OpenAI({ apiKey: openaiApiKey })

import { glob } from 'glob'

// Extract frontmatter from markdown content (same as SIRE script)
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
  const lines = frontmatterText.split('\n')
  let currentKey = null
  let currentValue = []

  for (let line of lines) {
    line = line.trim()
    if (!line || line.startsWith('#')) continue

    const colonIndex = line.indexOf(':')
    if (colonIndex > 0 && !line.startsWith(' ') && !line.startsWith('-')) {
      // Save previous key if exists
      if (currentKey) {
        if (currentValue.length === 1) {
          frontmatter[currentKey] = currentValue[0]
        } else if (currentValue.length > 1) {
          frontmatter[currentKey] = currentValue
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
      }

      currentValue = [value]
    } else if (line.startsWith('-') && currentKey) {
      // Array item
      const item = line.substring(1).trim().replace(/['"]/g, '')
      currentValue.push(item)
    } else if (line.includes(':') && currentKey) {
      // Nested object (simplified parsing)
      const nestedColonIndex = line.indexOf(':')
      const nestedKey = line.substring(0, nestedColonIndex).trim()
      let nestedValue = line.substring(nestedColonIndex + 1).trim()

      // Remove quotes
      if ((nestedValue.startsWith('"') && nestedValue.endsWith('"')) ||
          (nestedValue.startsWith("'") && nestedValue.endsWith("'"))) {
        nestedValue = nestedValue.slice(1, -1)
      }

      if (!frontmatter[currentKey]) frontmatter[currentKey] = {}
      frontmatter[currentKey][nestedKey] = nestedValue
    }
  }

  // Save last key
  if (currentKey) {
    if (currentValue.length === 1) {
      frontmatter[currentKey] = currentValue[0]
    } else if (currentValue.length > 1) {
      frontmatter[currentKey] = currentValue
    }
  }

  return { frontmatter, content: contentWithoutFrontmatter }
}

// Function to load and parse MUVA Markdown documents
async function loadMuvaDocuments() {
  const documents = []

  // Find all MUVA listing files
  const muvaFiles = await glob('_assets/muva/listings/**/*.md')

  for (const filePath of muvaFiles) {
    try {
      const fileContent = await fs.readFile(filePath, 'utf8')
      const { frontmatter: frontMatter, content } = extractFrontmatter(fileContent)

      // Skip files without proper frontmatter
      if (!frontMatter || !frontMatter.name) {
        console.warn(`⚠️  Skipping ${filePath}: No valid frontmatter or name found`)
        continue
      }

      // Extract business info from YAML front matter
      const document = {
        title: frontMatter.name,
        description: frontMatter.description || '',
        category: mapMuvaCategory(frontMatter.business_type) || 'attraction',
        location: `${frontMatter.location?.subzone || ''}, ${frontMatter.location?.zone || ''}, San Andrés`,
        city: "San Andrés",
        coordinates: getCoordinatesForZone(frontMatter.location?.zone),
        rating: 4.0, // Default rating
        price_range: mapPriceRange(frontMatter.pricing?.range) || '$',
        opening_hours: frontMatter.business_hours?.schedule || 'Consultar',
        contact_info: {
          phone: frontMatter.contact?.whatsapp || '',
          email: frontMatter.contact?.email || '',
          instagram: frontMatter.contact?.instagram || '',
          website: frontMatter.contact?.website || '',
          address: frontMatter.contact?.physical_address || ''
        },
        tags: frontMatter.tags || [],
        keywords: frontMatter.keywords || [],
        target_audience: frontMatter.target_audience || [],
        zone: frontMatter.location?.zone || '',
        subzone: frontMatter.location?.subzone || '',
        noise_level: frontMatter.location?.noise_level || '',
        security_level: frontMatter.location?.security_level || '',
        amenities: frontMatter.amenities || {},
        content: content // Full markdown content for embedding
      }

      documents.push(document)

    } catch (error) {
      console.warn(`⚠️  Could not process ${filePath}:`, error.message)
    }
  }

  return documents
}

// Helper function to get approximate coordinates for zones
function getCoordinatesForZone(zone) {
  const zoneCoordinates = {
    'Centro': [12.5833, -81.7000],
    'San Luis': [12.5500, -81.6800],
    'Cove': [12.5700, -81.7200],
    'Loma': [12.6000, -81.6900]
  }
  return zoneCoordinates[zone] || [12.5833, -81.7000] // Default to Centro
}

// Map MUVA business types to valid categories in database
function mapMuvaCategory(businessType) {
  const categoryMap = {
    'Actividad': 'activity',
    'Restaurante': 'restaurant',
    'Spot': 'attraction',
    'Night Life': 'nightlife',
    'Alquiler': 'rental'
  }
  return categoryMap[businessType] || 'attraction'
}

// Map price ranges to valid format
function mapPriceRange(priceRange) {
  if (!priceRange) return '$'

  // Detect if it contains numbers
  if (priceRange.includes('000')) {
    if (priceRange.includes('50,000') || priceRange.includes('90,000')) return '$'
    if (priceRange.includes('100,000') || priceRange.includes('200,000')) return '$$'
    if (priceRange.includes('400,000') || priceRange.includes('500,000')) return '$$$'
    if (priceRange.includes('1,000,000')) return '$$$$'
  }

  // Default mappings
  if (priceRange.toLowerCase().includes('libre') || priceRange.toLowerCase().includes('gratis')) return '$'
  if (priceRange.toLowerCase().includes('variable') || priceRange.toLowerCase().includes('consultar')) return '$'

  return '$'
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

async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
      dimensions: 3072
    })
    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

async function insertMuvaEmbedding(item, index, total) {
  try {
    console.log(`[${index + 1}/${total}] Processing: ${item.title}`)

    // Chunk the document content
    const chunks = chunkDocument(item.content)
    console.log(`📋 Document split into ${chunks.length} chunks`)

    // Process each chunk
    const results = []
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      console.log(`   ⚙️  Processing chunk ${i + 1}/${chunks.length}...`)

      try {
        // Generate embedding for this chunk
        const embedding = await generateEmbedding(chunk)

        // Prepare data for insertion
        const embeddingData = {
          content: chunk,
          embedding,
          title: item.title,
          description: item.description,
          category: item.category,
          location: item.location,
          city: item.city,
          coordinates: item.coordinates ? `(${item.coordinates[1]}, ${item.coordinates[0]})` : null,
          rating: item.rating,
          price_range: item.price_range,
          source_file: `muva_listings_${item.category}`,
          chunk_index: i,
          total_chunks: chunks.length,
          opening_hours: item.opening_hours,
          contact_info: item.contact_info,
          tags: item.tags,
          language: 'es',
        }

        // Insert into muva_embeddings table
        const { data, error } = await supabase
          .from('muva_embeddings')
          .insert(embeddingData)
          .select()

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
      title: item.title,
      totalChunks: chunks.length,
      successful,
      failed,
      results
    }
  } catch (error) {
    console.error(`❌ Failed to process ${item.title}:`, error)
    throw error
  }
}

async function clearExistingData() {
  console.log('🧹 Clearing existing MUVA embeddings...')

  const { error } = await supabase
    .from('muva_embeddings')
    .delete()
    .neq('id', '') // Delete all records

  if (error) {
    console.error('❌ Error clearing existing data:', error)
    throw error
  }

  console.log('✅ Existing data cleared')
}

async function testMuvaFunctions() {
  console.log('🧪 Testing MUVA database functions...')

  try {
    // Test basic table access
    const { data: countData, error: countError } = await supabase
      .from('muva_embeddings')
      .select('id', { count: 'exact' })

    if (countError) {
      console.error('❌ Error accessing muva_embeddings table:', countError)
      return false
    }

    console.log(`✅ muva_embeddings table accessible, ${countData.length} records found`)

    // Test match_muva_documents function with a sample embedding
    const sampleEmbedding = new Array(3072).fill(0).map(() => Math.random())

    const { data: searchData, error: searchError } = await supabase.rpc('match_muva_documents', {
      query_embedding: sampleEmbedding,
      match_threshold: 0.1,
      match_count: 3
    })

    if (searchError) {
      console.error('❌ Error testing match_muva_documents function:', searchError)
      return false
    }

    console.log(`✅ match_muva_documents function working, returned ${searchData.length} results`)
    return true
  } catch (error) {
    console.error('❌ Error testing MUVA functions:', error)
    return false
  }
}

async function main() {
  try {
    console.log('🏝️ Starting MUVA Tourism Embeddings Population')
    console.log('================================================')

    // Test database functions first
    const functionsWork = await testMuvaFunctions()
    if (!functionsWork) {
      console.error('❌ Database functions test failed. Please check migrations.')
      process.exit(1)
    }

    // Clear existing data
    await clearExistingData()

    // Load MUVA documents from Markdown files
    console.log('📂 Loading MUVA documents from Markdown files...')
    const muvaDocuments = await loadMuvaDocuments()

    if (muvaDocuments.length === 0) {
      console.log('⚠️  No MUVA documents found')
      process.exit(1)
    }

    console.log(`📥 Processing ${muvaDocuments.length} MUVA tourism items...`)

    // Process each document and collect results
    const documentResults = []
    for (let i = 0; i < muvaDocuments.length; i++) {
      const result = await insertMuvaEmbedding(muvaDocuments[i], i, muvaDocuments.length)
      documentResults.push(result)

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Summary statistics
    let totalSuccessful = 0
    let totalFailed = 0
    let totalChunks = 0

    documentResults.forEach(result => {
      totalSuccessful += result.successful
      totalFailed += result.failed
      totalChunks += result.totalChunks
    })

    console.log('🎉 MUVA tourism embeddings population completed successfully!')
    console.log(`📊 Summary: ${muvaDocuments.length} documents, ${totalChunks} chunks, ${totalSuccessful} successful, ${totalFailed} failed`)

    // Final test
    console.log('🔍 Running final verification...')
    const { data: finalCount, error: finalError } = await supabase
      .from('muva_embeddings')
      .select('id', { count: 'exact' })

    if (finalError) {
      console.error('❌ Error in final verification:', finalError)
    } else {
      console.log(`✅ Final verification: ${finalCount.length} records in muva_embeddings table`)
    }

    console.log('🚀 MUVA is ready for tourism queries!')

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

// Handle command line arguments
if (process.argv.includes('--help')) {
  console.log(`
MUVA Tourism Embeddings Population Script

Usage:
  node scripts/populate-muva-embeddings.js [options]

Options:
  --help      Show this help message
  --test      Only test database functions without inserting data

This script populates the muva_embeddings table with sample tourism data
for San Andrés and Colombian destinations.

Required environment variables:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  OPENAI_API_KEY
`)
  process.exit(0)
}

if (process.argv.includes('--test')) {
  testMuvaFunctions().then(success => {
    if (success) {
      console.log('✅ All MUVA functions are working correctly')
      process.exit(0)
    } else {
      console.log('❌ Some MUVA functions failed')
      process.exit(1)
    }
  })
} else {
  main()
}