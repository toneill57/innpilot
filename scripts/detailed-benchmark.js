#!/usr/bin/env node

/**
 * Detailed Performance Benchmark Script
 * Compares localhost vs Vercel with fresh requests only
 * Avoids cache hits by using unique questions
 */

import { performance } from 'perf_hooks'
import { writeFileSync } from 'fs'

const LOCALHOST_URL = 'http://localhost:3000'
const PRODUCTION_URL = 'https://innpilot.vercel.app'

// Unique questions to avoid semantic cache hits
// Each question targets specific, unique aspects to ensure fresh requests
const uniqueTestQuestions = [
  "¿Cuál es el contenido exacto del campo número 1 en el archivo SIRE?",
  "¿Qué significa específicamente el código de documento tipo 46 en SIRE?",
  "¿Cuál es el formato exacto requerido para el campo fecha de nacimiento?",
  "¿Qué validación específica se hace para el campo número de documento?",
  "¿Cuál es la longitud máxima permitida para el campo primer nombre?",
  "¿Qué caracteres especiales están prohibidos en el campo segundo apellido?",
  "¿Cuál es el rango de valores válidos para el campo tipo de movimiento?",
  "¿Qué formato específico debe tener el campo fecha de entrada al país?",
  "¿Cuáles son las reglas de validación para el campo lugar de expedición?",
  "¿Qué información debe contener exactamente el campo observaciones?",
  "¿Cuál es el tamaño máximo en bytes para todo el archivo SIRE?",
  "¿Qué encoding de caracteres debe usar el archivo de texto SIRE?",
  "¿Cuántos registros máximos puede contener un solo archivo SIRE?",
  "¿Qué formato específico debe tener el nombre del archivo al subirlo?",
  "¿Cuáles son los horarios permitidos para subir archivos al sistema SIRE?"
]

class DetailedBenchmark {
  constructor() {
    this.results = {
      localhost: [],
      production: [],
      metadata: {
        timestamp: new Date().toISOString(),
        totalQuestions: uniqueTestQuestions.length,
        iterationsPerQuestion: 3
      }
    }
  }

  async clearCache(url) {
    try {
      // Try to clear any potential cache by making a random request
      const randomQuestion = `Cache clear test ${Math.random()}`
      await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: randomQuestion })
      })
      await new Promise(resolve => setTimeout(resolve, 100)) // Brief pause
    } catch (e) {
      console.warn(`⚠️  Cache clear attempt failed for ${url}:`, e.message)
    }
  }

  async testSingleRequest(url, question, iteration, environment) {
    const testStart = performance.now()

    try {
      const requestStart = performance.now()

      const response = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })

      const requestEnd = performance.now()

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const testEnd = performance.now()

      return {
        success: true,
        environment,
        question: question.substring(0, 60) + '...',
        iteration,
        timings: {
          totalClientTime: Math.round(testEnd - testStart),
          networkTime: Math.round(requestEnd - requestStart),
          serverTime: data.performance?.total_time_ms || null,
        },
        cacheHit: data.performance?.cache_hit || false,
        contextUsed: data.context_used || false,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      const testEnd = performance.now()
      return {
        success: false,
        environment,
        question: question.substring(0, 60) + '...',
        iteration,
        error: error.message,
        timings: {
          totalClientTime: Math.round(testEnd - testStart),
          networkTime: null,
          serverTime: null,
        },
        timestamp: new Date().toISOString()
      }
    }
  }

  async runBenchmark() {
    console.log('🚀 InnPilot Detailed Performance Benchmark')
    console.log('=' * 60)
    console.log(`📍 Localhost:   ${LOCALHOST_URL}`)
    console.log(`🌐 Production:  ${PRODUCTION_URL}`)
    console.log(`📝 Questions:   ${uniqueTestQuestions.length}`)
    console.log(`🔄 Iterations:  3 per question per environment`)
    console.log(`🎯 Focus:       Fresh requests only (no cache)`)
    console.log('')

    let totalTests = uniqueTestQuestions.length * 2 * 3 // questions * environments * iterations
    let currentTest = 0

    for (let i = 0; i < uniqueTestQuestions.length; i++) {
      const question = uniqueTestQuestions[i]
      console.log(`\n${i + 1}. ${question.substring(0, 80)}${question.length > 80 ? '...' : ''}`)

      // Test localhost (3 iterations)
      console.log('  🏠 Testing localhost...')
      for (let iter = 1; iter <= 3; iter++) {
        currentTest++
        const progress = Math.round((currentTest / totalTests) * 100)

        // Clear any potential cache before each test
        await this.clearCache(LOCALHOST_URL)

        const result = await this.testSingleRequest(
          LOCALHOST_URL,
          question,
          iter,
          'localhost'
        )

        this.results.localhost.push(result)

        if (result.success) {
          const cacheStatus = result.cacheHit ? '(⚠️ CACHED!)' : '(fresh)'
          console.log(`     ${iter}. ${result.timings.totalClientTime}ms client, ${result.timings.serverTime}ms server ${cacheStatus} [${progress}%]`)
        } else {
          console.log(`     ${iter}. ❌ ERROR: ${result.error} [${progress}%]`)
        }

        // Pause between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Test production (3 iterations)
      console.log('  🌐 Testing production...')
      for (let iter = 1; iter <= 3; iter++) {
        currentTest++
        const progress = Math.round((currentTest / totalTests) * 100)

        // Clear any potential cache before each test
        await this.clearCache(PRODUCTION_URL)

        const result = await this.testSingleRequest(
          PRODUCTION_URL,
          question,
          iter,
          'production'
        )

        this.results.production.push(result)

        if (result.success) {
          const cacheStatus = result.cacheHit ? '(⚠️ CACHED!)' : '(fresh)'
          console.log(`     ${iter}. ${result.timings.totalClientTime}ms client, ${result.timings.serverTime}ms server ${cacheStatus} [${progress}%]`)
        } else {
          console.log(`     ${iter}. ❌ ERROR: ${result.error} [${progress}%]`)
        }

        // Pause between requests
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    this.analyzeResults()
    this.saveResults()
  }

  analyzeResults() {
    console.log('\n\n📊 DETAILED PERFORMANCE ANALYSIS')
    console.log('=' * 60)

    const localhostSuccessful = this.results.localhost.filter(r => r.success && !r.cacheHit)
    const productionSuccessful = this.results.production.filter(r => r.success && !r.cacheHit)

    if (localhostSuccessful.length === 0 || productionSuccessful.length === 0) {
      console.log('❌ Insufficient data for analysis')
      return
    }

    // Calculate statistics
    const calculateStats = (results, timeKey) => {
      const times = results.map(r => r.timings[timeKey]).filter(t => t !== null)
      if (times.length === 0) return null

      times.sort((a, b) => a - b)
      return {
        count: times.length,
        avg: Math.round(times.reduce((sum, t) => sum + t, 0) / times.length),
        median: times[Math.floor(times.length / 2)],
        min: Math.min(...times),
        max: Math.max(...times),
        p90: times[Math.floor(times.length * 0.9)],
        p95: times[Math.floor(times.length * 0.95)],
        stdDev: Math.round(Math.sqrt(times.reduce((sum, t) => sum + Math.pow(t - (times.reduce((s, x) => s + x, 0) / times.length), 2), 0) / times.length))
      }
    }

    console.log('\n🏠 LOCALHOST RESULTS:')
    const localhostClient = calculateStats(localhostSuccessful, 'totalClientTime')
    const localhostServer = calculateStats(localhostSuccessful, 'serverTime')

    if (localhostClient) {
      console.log(`   Client Times: ${localhostClient.avg}ms avg (${localhostClient.min}-${localhostClient.max}ms range)`)
      console.log(`   Server Times: ${localhostServer?.avg || 'N/A'}ms avg (${localhostServer?.min || 'N/A'}-${localhostServer?.max || 'N/A'}ms range)`)
      console.log(`   P90/P95: ${localhostClient.p90}ms / ${localhostClient.p95}ms`)
      console.log(`   Std Dev: ±${localhostClient.stdDev}ms`)
      console.log(`   Tests: ${localhostClient.count} successful`)
    }

    console.log('\n🌐 PRODUCTION RESULTS:')
    const productionClient = calculateStats(productionSuccessful, 'totalClientTime')
    const productionServer = calculateStats(productionSuccessful, 'serverTime')

    if (productionClient) {
      console.log(`   Client Times: ${productionClient.avg}ms avg (${productionClient.min}-${productionClient.max}ms range)`)
      console.log(`   Server Times: ${productionServer?.avg || 'N/A'}ms avg (${productionServer?.min || 'N/A'}-${productionServer?.max || 'N/A'}ms range)`)
      console.log(`   P90/P95: ${productionClient.p90}ms / ${productionClient.p95}ms`)
      console.log(`   Std Dev: ±${productionClient.stdDev}ms`)
      console.log(`   Tests: ${productionClient.count} successful`)
    }

    // Performance comparison
    if (localhostClient && productionClient) {
      const speedRatio = localhostClient.avg / productionClient.avg
      const improvement = Math.round((1 - productionClient.avg / localhostClient.avg) * 100)

      console.log('\n🔄 PERFORMANCE COMPARISON:')
      console.log(`   Speed Ratio: ${speedRatio.toFixed(1)}x (localhost vs production)`)

      if (improvement > 0) {
        console.log(`   🚀 Production is ${improvement}% faster than localhost`)
      } else {
        console.log(`   ⚠️  Localhost is ${Math.abs(improvement)}% faster than production`)
      }

      console.log(`   Difference: ${localhostClient.avg - productionClient.avg}ms avg`)
    }

    // Cache hit analysis
    const localhostCacheHits = this.results.localhost.filter(r => r.success && r.cacheHit).length
    const productionCacheHits = this.results.production.filter(r => r.success && r.cacheHit).length

    console.log('\n🎯 CACHE ANALYSIS:')
    console.log(`   Localhost cache hits: ${localhostCacheHits}/${this.results.localhost.length} (${Math.round(localhostCacheHits/this.results.localhost.length*100)}%)`)
    console.log(`   Production cache hits: ${productionCacheHits}/${this.results.production.length} (${Math.round(productionCacheHits/this.results.production.length*100)}%)`)

    if (localhostCacheHits > 0 || productionCacheHits > 0) {
      console.log('   ⚠️  Some requests hit cache - use more unique questions for pure fresh request testing')
    }

    // Error analysis
    const localhostErrors = this.results.localhost.filter(r => !r.success).length
    const productionErrors = this.results.production.filter(r => !r.success).length

    if (localhostErrors > 0 || productionErrors > 0) {
      console.log('\n❌ ERROR SUMMARY:')
      if (localhostErrors > 0) console.log(`   Localhost errors: ${localhostErrors}`)
      if (productionErrors > 0) console.log(`   Production errors: ${productionErrors}`)
    }
  }

  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `benchmark-results-${timestamp}.json`

    try {
      writeFileSync(filename, JSON.stringify(this.results, null, 2))
      console.log(`\n💾 Results saved to: ${filename}`)
    } catch (e) {
      console.warn(`⚠️  Failed to save results: ${e.message}`)
    }

    console.log('\n🏁 Benchmark completed!')
  }
}

// Run benchmark if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const benchmark = new DetailedBenchmark()
  benchmark.runBenchmark().catch(console.error)
}