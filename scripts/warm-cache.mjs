#!/usr/bin/env node

/**
 * MUVA Cache Warm-up Script
 * Pre-generates embeddings for popular tourism queries
 * to improve response times for common questions
 */

import OpenAI from 'openai'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Top 20 popular queries for aggressive cache warm-up
const POPULAR_QUERIES = [
  "mejores restaurantes de san andrés",
  "actividades de buceo",
  "playas para snorkeling",
  "vida nocturna san andrés",
  "hoteles económicos",
  "transporte en la isla",
  "donde comprar souvenirs",
  "mejores playas",
  "restaurantes de mariscos",
  "tours en catamarán",
  "buceo en san andrés",
  "mejores hoteles",
  "comida típica",
  "actividades acuáticas",
  "johnny cay tour",
  "bares y discotecas",
  "alquiler de motos",
  "playa spratt bight",
  "restaurantes económicos",
  "smoothies bali"
]

// Simple hash function for cache keys
function hashMuvaQuestion(question) {
  const str = question.toLowerCase().trim()
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

async function warmUpCache() {
  console.log('🔥 Starting MUVA cache warm-up...')
  const startTime = Date.now()

  let successCount = 0
  let errorCount = 0

  // Process all queries in parallel for maximum speed
  const warmupPromises = POPULAR_QUERIES.map(async (query, index) => {
    try {
      console.log(`[${index + 1}/${POPULAR_QUERIES.length}] Generating embedding for: "${query}"`)

      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: query,
        dimensions: 3072
      })

      const embedding = embeddingResponse.data[0].embedding
      const cacheKey = hashMuvaQuestion(query)

      console.log(`✅ Generated embedding for "${query}" (${embedding.length} dimensions)`)
      successCount++

      return {
        query,
        cacheKey,
        embedding,
        success: true
      }
    } catch (error) {
      console.error(`❌ Failed to generate embedding for "${query}":`, error.message)
      errorCount++

      return {
        query,
        error: error.message,
        success: false
      }
    }
  })

  // Wait for all embeddings to complete
  const results = await Promise.allSettled(warmupPromises)

  const totalTime = Date.now() - startTime

  console.log('\n📊 Cache Warm-up Results:')
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${errorCount}`)
  console.log(`⏱️  Total time: ${totalTime}ms`)
  console.log(`🚀 Average time per query: ${Math.round(totalTime / POPULAR_QUERIES.length)}ms`)

  // Show failed queries for debugging
  const failedResults = results
    .map(r => r.value)
    .filter(r => r && !r.success)

  if (failedResults.length > 0) {
    console.log('\n⚠️  Failed queries:')
    failedResults.forEach(result => {
      console.log(`  - "${result.query}": ${result.error}`)
    })
  }

  console.log('\n🎯 Cache warm-up completed! These embeddings will improve response times.')

  return {
    total: POPULAR_QUERIES.length,
    successful: successCount,
    failed: errorCount,
    totalTime,
    avgTimePerQuery: Math.round(totalTime / POPULAR_QUERIES.length)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  warmUpCache()
    .then(results => {
      console.log('\n🏆 Warm-up completed successfully!')
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Warm-up failed:', error)
      process.exit(1)
    })
}

export { warmUpCache, POPULAR_QUERIES }