#!/usr/bin/env node

/**
 * MUVA Embedding Model Comparison
 * Tests text-embedding-3-large vs text-embedding-3-small
 * for performance and quality trade-offs
 */

import OpenAI from 'openai'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Test queries representing different types of tourism questions
const TEST_QUERIES = [
  "mejores restaurantes de san andrés",
  "actividades de buceo",
  "hoteles económicos",
  "vida nocturna",
  "smoothies y cafés",
  "tours en catamarán",
  "alquiler de motos",
  "playas para familias"
]

async function testEmbeddingModel(model, dimensions) {
  console.log(`\n🧪 Testing ${model} (${dimensions} dimensions)...`)

  const results = []
  let totalTime = 0

  for (const query of TEST_QUERIES) {
    const startTime = Date.now()

    try {
      const response = await openai.embeddings.create({
        model: model,
        input: query,
        dimensions: dimensions
      })

      const time = Date.now() - startTime
      totalTime += time

      results.push({
        query,
        time,
        dimensions: response.data[0].embedding.length,
        success: true
      })

      console.log(`  ✅ "${query}": ${time}ms`)
    } catch (error) {
      console.log(`  ❌ "${query}": ${error.message}`)
      results.push({
        query,
        error: error.message,
        success: false
      })
    }
  }

  const successful = results.filter(r => r.success)
  const avgTime = successful.length > 0 ? Math.round(totalTime / successful.length) : 0

  return {
    model,
    dimensions,
    totalTime,
    avgTime,
    successful: successful.length,
    failed: results.length - successful.length,
    results
  }
}

async function compareModels() {
  console.log('🔬 MUVA Embedding Model Performance Comparison')
  console.log('=' .repeat(60))

  // Test both models
  const largeResults = await testEmbeddingModel('text-embedding-3-large', 3072)
  const smallResults = await testEmbeddingModel('text-embedding-3-small', 1536)

  // Performance comparison
  console.log('\n📊 Performance Comparison:')
  console.log('-'.repeat(60))
  console.log(`text-embedding-3-large (3072d):`)
  console.log(`  ⏱️  Average time: ${largeResults.avgTime}ms`)
  console.log(`  ✅ Success rate: ${largeResults.successful}/${TEST_QUERIES.length}`)
  console.log(`  📏 Dimensions: 3072 (HNSW incompatible)`)

  console.log(`\ntext-embedding-3-small (1536d):`)
  console.log(`  ⏱️  Average time: ${smallResults.avgTime}ms`)
  console.log(`  ✅ Success rate: ${smallResults.successful}/${TEST_QUERIES.length}`)
  console.log(`  📏 Dimensions: 1536 (HNSW compatible)`)

  // Calculate improvements
  if (largeResults.avgTime > 0 && smallResults.avgTime > 0) {
    const timeImprovement = Math.round(((largeResults.avgTime - smallResults.avgTime) / largeResults.avgTime) * 100)
    const dimensionReduction = Math.round(((3072 - 1536) / 3072) * 100)

    console.log('\n🚀 Potential Improvements with text-embedding-3-small:')
    console.log(`  ⚡ Speed improvement: ${timeImprovement > 0 ? '+' : ''}${timeImprovement}%`)
    console.log(`  📦 Size reduction: ${dimensionReduction}%`)
    console.log(`  🗂️  HNSW index compatibility: ✅`)
    console.log(`  💾 Storage reduction: ~${dimensionReduction}%`)
  }

  // Recommendations
  console.log('\n💡 Recommendations:')
  if (smallResults.avgTime < largeResults.avgTime) {
    console.log('  ✅ text-embedding-3-small shows better performance')
    console.log('  ✅ Compatible with HNSW indexing for faster vector search')
    console.log('  ✅ Significant storage and bandwidth savings')
    console.log('  ⚠️  Consider testing semantic quality with actual queries')
  } else {
    console.log('  ⚠️  text-embedding-3-large shows better performance in this test')
    console.log('  ❌ Cannot use HNSW indexing (3072 > 2000 limit)')
  }

  console.log('\n🎯 Next Steps:')
  console.log('  1. Test semantic quality with real MUVA queries')
  console.log('  2. Compare search result relevance')
  console.log('  3. If quality is acceptable, migrate to text-embedding-3-small')
  console.log('  4. Implement HNSW indexing for 50-80% faster vector search')

  return {
    large: largeResults,
    small: smallResults
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  compareModels()
    .then(results => {
      console.log('\n🏆 Comparison completed!')
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Comparison failed:', error)
      process.exit(1)
    })
}

export { compareModels, testEmbeddingModel }