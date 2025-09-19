#!/usr/bin/env node

/**
 * Performance testing script
 * Compares response times between localhost and Vercel production
 */

import { performance } from 'perf_hooks'

const LOCALHOST_URL = 'http://localhost:3000'
const PRODUCTION_URL = 'https://innpilot.vercel.app'

// Test questions that cover different semantic groups
const testQuestions = [
  "¿Cuáles son los 13 campos obligatorios del SIRE?",
  "¿Qué tipos de documento son válidos para SIRE?",
  "¿Cuál es el formato del archivo SIRE?",
  "¿Cuáles son los errores más comunes en reportes SIRE?",
  "¿Qué es el SIRE?", // General question
  "¿Cuáles son los 7 pasos oficiales para reportar información al SIRE?",
]

async function testEndpoint(url, question, iteration = 1) {
  const start = performance.now()

  try {
    const response = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    const end = performance.now()
    const totalTime = end - start

    return {
      success: true,
      totalTime: Math.round(totalTime),
      serverTime: data.performance?.total_time_ms || null,
      cacheHit: data.performance?.cache_hit || false,
      environment: data.performance?.environment || 'unknown',
      contextUsed: data.context_used || false,
      question: question.substring(0, 50) + (question.length > 50 ? '...' : ''),
      iteration
    }
  } catch (error) {
    const end = performance.now()
    return {
      success: false,
      totalTime: Math.round(end - start),
      error: error.message,
      question: question.substring(0, 50) + (question.length > 50 ? '...' : ''),
      iteration
    }
  }
}

async function runPerformanceTest() {
  console.log('🚀 InnPilot Performance Comparison Test')
  console.log('=' * 50)
  console.log('📍 Local:      ', LOCALHOST_URL)
  console.log('🌐 Production: ', PRODUCTION_URL)
  console.log('📝 Questions:  ', testQuestions.length)
  console.log('')

  const results = {
    localhost: [],
    production: []
  }

  console.log('🧪 Testing each question 2 times (cold + warm cache)...\n')

  for (let i = 0; i < testQuestions.length; i++) {
    const question = testQuestions[i]
    console.log(`${i + 1}. ${question.substring(0, 60)}${question.length > 60 ? '...' : ''}`)

    // Test localhost (2 iterations to test cache)
    console.log('  🏠 Testing localhost...')
    for (let iter = 1; iter <= 2; iter++) {
      const result = await testEndpoint(LOCALHOST_URL, question, iter)
      results.localhost.push(result)

      if (result.success) {
        const cacheStatus = result.cacheHit ? '(cached)' : '(fresh)'
        console.log(`     ${iter}. ${result.totalTime}ms ${cacheStatus} [server: ${result.serverTime}ms]`)
      } else {
        console.log(`     ${iter}. ERROR: ${result.error}`)
      }

      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Test production (2 iterations to test cache)
    console.log('  🌐 Testing production...')
    for (let iter = 1; iter <= 2; iter++) {
      const result = await testEndpoint(PRODUCTION_URL, question, iter)
      results.production.push(result)

      if (result.success) {
        const cacheStatus = result.cacheHit ? '(cached)' : '(fresh)'
        console.log(`     ${iter}. ${result.totalTime}ms ${cacheStatus} [server: ${result.serverTime}ms]`)
      } else {
        console.log(`     ${iter}. ERROR: ${result.error}`)
      }

      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log('')
  }

  // Calculate statistics
  console.log('📊 PERFORMANCE SUMMARY')
  console.log('=' * 50)

  const localhostSuccessful = results.localhost.filter(r => r.success)
  const productionSuccessful = results.production.filter(r => r.success)

  if (localhostSuccessful.length > 0) {
    const localhostFresh = localhostSuccessful.filter(r => !r.cacheHit)
    const localhostCached = localhostSuccessful.filter(r => r.cacheHit)

    console.log('\n🏠 LOCALHOST:')
    console.log(`   Fresh requests: ${localhostFresh.length}`)
    if (localhostFresh.length > 0) {
      const avgFresh = Math.round(localhostFresh.reduce((sum, r) => sum + r.totalTime, 0) / localhostFresh.length)
      const minFresh = Math.min(...localhostFresh.map(r => r.totalTime))
      const maxFresh = Math.max(...localhostFresh.map(r => r.totalTime))
      console.log(`     Average: ${avgFresh}ms | Min: ${minFresh}ms | Max: ${maxFresh}ms`)
    }

    console.log(`   Cached requests: ${localhostCached.length}`)
    if (localhostCached.length > 0) {
      const avgCached = Math.round(localhostCached.reduce((sum, r) => sum + r.totalTime, 0) / localhostCached.length)
      const minCached = Math.min(...localhostCached.map(r => r.totalTime))
      const maxCached = Math.max(...localhostCached.map(r => r.totalTime))
      console.log(`     Average: ${avgCached}ms | Min: ${minCached}ms | Max: ${maxCached}ms`)
    }
  }

  if (productionSuccessful.length > 0) {
    const productionFresh = productionSuccessful.filter(r => !r.cacheHit)
    const productionCached = productionSuccessful.filter(r => r.cacheHit)

    console.log('\n🌐 PRODUCTION:')
    console.log(`   Fresh requests: ${productionFresh.length}`)
    if (productionFresh.length > 0) {
      const avgFresh = Math.round(productionFresh.reduce((sum, r) => sum + r.totalTime, 0) / productionFresh.length)
      const minFresh = Math.min(...productionFresh.map(r => r.totalTime))
      const maxFresh = Math.max(...productionFresh.map(r => r.totalTime))
      console.log(`     Average: ${avgFresh}ms | Min: ${minFresh}ms | Max: ${maxFresh}ms`)
    }

    console.log(`   Cached requests: ${productionCached.length}`)
    if (productionCached.length > 0) {
      const avgCached = Math.round(productionCached.reduce((sum, r) => sum + r.totalTime, 0) / productionCached.length)
      const minCached = Math.min(...productionCached.map(r => r.totalTime))
      const maxCached = Math.max(...productionCached.map(r => r.totalTime))
      console.log(`     Average: ${avgCached}ms | Min: ${minCached}ms | Max: ${maxCached}ms`)
    }
  }

  // Comparison
  if (localhostSuccessful.length > 0 && productionSuccessful.length > 0) {
    const localhostFresh = localhostSuccessful.filter(r => !r.cacheHit)
    const productionFresh = productionSuccessful.filter(r => !r.cacheHit)

    if (localhostFresh.length > 0 && productionFresh.length > 0) {
      const localhostAvg = Math.round(localhostFresh.reduce((sum, r) => sum + r.totalTime, 0) / localhostFresh.length)
      const productionAvg = Math.round(productionFresh.reduce((sum, r) => sum + r.totalTime, 0) / productionFresh.length)

      console.log('\n🔄 COMPARISON (Fresh requests):')
      if (localhostAvg < productionAvg) {
        const improvement = Math.round(((productionAvg - localhostAvg) / productionAvg) * 100)
        console.log(`   ✅ Localhost is ${improvement}% faster than production`)
      } else if (productionAvg < localhostAvg) {
        const difference = Math.round(((localhostAvg - productionAvg) / localhostAvg) * 100)
        console.log(`   ⚠️  Production is ${difference}% faster than localhost`)
      } else {
        console.log(`   🎯 Performance is similar (difference < 1%)`)
      }
    }
  }

  // Error summary
  const localhostErrors = results.localhost.filter(r => !r.success)
  const productionErrors = results.production.filter(r => !r.success)

  if (localhostErrors.length > 0 || productionErrors.length > 0) {
    console.log('\n❌ ERRORS:')
    if (localhostErrors.length > 0) {
      console.log(`   Localhost: ${localhostErrors.length} errors`)
    }
    if (productionErrors.length > 0) {
      console.log(`   Production: ${productionErrors.length} errors`)
    }
  }

  console.log('\n🏁 Test completed!')
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  runPerformanceTest().catch(console.error)
}