#!/usr/bin/env node

/**
 * Quick Performance Benchmark
 * Fast comparison with fewer questions but precise results
 */

import { performance } from 'perf_hooks'

const LOCALHOST_URL = 'http://localhost:3000'
const PRODUCTION_URL = 'https://innpilot.vercel.app'

// 5 unique questions to avoid cache
const questions = [
  "¿Cuál es el contenido exacto del campo número 1 en el archivo SIRE?",
  "¿Qué significa específicamente el código de documento tipo 46 en SIRE?",
  "¿Cuál es el formato exacto requerido para el campo fecha de nacimiento?",
  "¿Qué validación específica se hace para el campo número de documento?",
  "¿Cuál es la longitud máxima permitida para el campo primer nombre?"
]

async function testEndpoint(url, question, envName) {
  const start = performance.now()

  try {
    const response = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    const end = performance.now()

    return {
      success: true,
      totalTime: Math.round(end - start),
      serverTime: data.performance?.total_time_ms || null,
      cacheHit: data.performance?.cache_hit || false,
      environment: envName
    }
  } catch (error) {
    const end = performance.now()
    return {
      success: false,
      totalTime: Math.round(end - start),
      error: error.message,
      environment: envName
    }
  }
}

async function runQuickBenchmark() {
  console.log('⚡ Quick Performance Benchmark')
  console.log('=' * 40)
  console.log('🎯 Testing fresh requests only (no cache)')
  console.log('')

  const results = { localhost: [], production: [] }

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i]
    console.log(`${i + 1}. ${question.substring(0, 60)}...`)

    // Test localhost
    console.log('  🏠 Localhost:', end='')
    const localhostResult = await testEndpoint(LOCALHOST_URL, question, 'localhost')
    results.localhost.push(localhostResult)

    if (localhostResult.success) {
      const cache = localhostResult.cacheHit ? ' (CACHED!)' : ' (fresh)'
      console.log(` ${localhostResult.totalTime}ms${cache}`)
    } else {
      console.log(` ERROR: ${localhostResult.error}`)
    }

    await new Promise(resolve => setTimeout(resolve, 200))

    // Test production
    console.log('  🌐 Production:', end='')
    const prodResult = await testEndpoint(PRODUCTION_URL, question, 'production')
    results.production.push(prodResult)

    if (prodResult.success) {
      const cache = prodResult.cacheHit ? ' (CACHED!)' : ' (fresh)'
      console.log(` ${prodResult.totalTime}ms${cache}`)
    } else {
      console.log(` ERROR: ${prodResult.error}`)
    }

    await new Promise(resolve => setTimeout(resolve, 200))
    console.log('')
  }

  // Analysis
  console.log('📊 RESULTS SUMMARY')
  console.log('=' * 40)

  const localhostFresh = results.localhost.filter(r => r.success && !r.cacheHit)
  const productionFresh = results.production.filter(r => r.success && !r.cacheHit)

  if (localhostFresh.length > 0) {
    const times = localhostFresh.map(r => r.totalTime)
    const avg = Math.round(times.reduce((sum, t) => sum + t, 0) / times.length)
    const min = Math.min(...times)
    const max = Math.max(...times)
    console.log(`🏠 Localhost: ${avg}ms avg (${min}-${max}ms range) - ${localhostFresh.length} tests`)
  }

  if (productionFresh.length > 0) {
    const times = productionFresh.map(r => r.totalTime)
    const avg = Math.round(times.reduce((sum, t) => sum + t, 0) / times.length)
    const min = Math.min(...times)
    const max = Math.max(...times)
    console.log(`🌐 Production: ${avg}ms avg (${min}-${max}ms range) - ${productionFresh.length} tests`)
  }

  if (localhostFresh.length > 0 && productionFresh.length > 0) {
    const localhostAvg = Math.round(localhostFresh.map(r => r.totalTime).reduce((sum, t) => sum + t, 0) / localhostFresh.length)
    const productionAvg = Math.round(productionFresh.map(r => r.totalTime).reduce((sum, t) => sum + t, 0) / productionFresh.length)

    const ratio = (localhostAvg / productionAvg).toFixed(1)
    const improvement = Math.round((1 - productionAvg / localhostAvg) * 100)

    console.log('')
    console.log(`🔄 Performance Ratio: ${ratio}x (localhost/production)`)
    console.log(`📈 Production is ${improvement}% faster than localhost`)
    console.log(`⏱️  Difference: ${localhostAvg - productionAvg}ms average`)
  }

  // Cache warnings
  const localhostCached = results.localhost.filter(r => r.success && r.cacheHit).length
  const productionCached = results.production.filter(r => r.success && r.cacheHit).length

  if (localhostCached > 0 || productionCached > 0) {
    console.log('')
    console.log('⚠️  CACHE HITS DETECTED:')
    if (localhostCached > 0) console.log(`   Localhost: ${localhostCached} cached responses`)
    if (productionCached > 0) console.log(`   Production: ${productionCached} cached responses`)
    console.log('   Consider using more unique questions for fresh-only testing')
  }

  console.log('\n✅ Quick benchmark completed!')
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runQuickBenchmark().catch(console.error)
}