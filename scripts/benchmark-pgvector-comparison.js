#!/usr/bin/env node

/**
 * Benchmark: Localhost vs Vercel pgvector Performance
 * Tests optimized questions to compare vector search performance
 */

import { performance } from 'perf_hooks'
import { writeFileSync } from 'fs'

const LOCALHOST_URL = 'http://localhost:3000'
const PRODUCTION_URL = 'https://innpilot.vercel.app'

// 5 optimized questions that should find relevant documents
// Each designed to avoid semantic cache hits and test vector search
const benchmarkQuestions = [
  "¿Cuáles son exactamente los 13 campos obligatorios que debo incluir en mi archivo SIRE?",
  "¿Qué códigos de documento son válidos para extranjeros en el sistema SIRE de Colombia?",
  "¿Cuál es el formato preciso requerido para las fechas en los archivos SIRE?",
  "¿Qué validaciones específicas realiza el sistema al procesar un archivo de huéspedes?",
  "¿Cuáles son los pasos oficiales para reportar correctamente la información al SIRE?"
]

class PgvectorBenchmark {
  constructor() {
    this.results = {
      localhost: [],
      production: [],
      comparison: {},
      metadata: {
        timestamp: new Date().toISOString(),
        totalQuestions: benchmarkQuestions.length,
        iterationsPerQuestion: 3,
        pgvectorStatus: {
          localhost: 'unknown',
          production: 'unknown'
        }
      }
    }
  }

  async makeRequest(url, question) {
    const startTime = performance.now()

    try {
      const response = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question })
      })

      const endTime = performance.now()
      const data = await response.json()

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.error || 'Request failed'}`)
      }

      return {
        success: true,
        duration: endTime - startTime,
        response: data,
        contextUsed: data.context_used || false,
        performance: data.performance || {},
        cacheHit: data.performance?.cache_hit || false
      }

    } catch (error) {
      const endTime = performance.now()
      return {
        success: false,
        duration: endTime - startTime,
        error: error.message
      }
    }
  }

  async clearCacheWithRandomRequest(url) {
    try {
      const randomQuery = `Cache clear test ${Math.random()}`
      await this.makeRequest(url, randomQuery)
      // Wait a bit for cache clearing
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.log(`Warning: Could not clear cache for ${url}:`, error.message)
    }
  }

  async benchmarkEnvironment(url, envName) {
    console.log(`\n🚀 Testing ${envName} (${url})`)
    const envResults = []

    for (let questionIndex = 0; questionIndex < benchmarkQuestions.length; questionIndex++) {
      const question = benchmarkQuestions[questionIndex]
      console.log(`\n  📝 Question ${questionIndex + 1}/5: "${question.substring(0, 60)}..."`)

      const questionResults = []

      for (let iteration = 0; iteration < 3; iteration++) {
        console.log(`    🔄 Iteration ${iteration + 1}/3...`)

        // Clear cache before each iteration
        await this.clearCacheWithRandomRequest(url)

        const result = await this.makeRequest(url, question)

        if (result.success) {
          console.log(`    ✅ ${result.duration.toFixed(0)}ms - Context: ${result.contextUsed ? 'YES' : 'NO'} - Cache: ${result.cacheHit ? 'HIT' : 'MISS'}`)

          // Detect pgvector usage based on performance data
          if (result.performance.total_time_ms) {
            // If we have detailed performance data, check if search time is optimized
            const searchTime = result.performance.search_time_ms || 0
            if (searchTime < 500 && result.contextUsed) {
              this.results.metadata.pgvectorStatus[envName === 'Localhost' ? 'localhost' : 'production'] = 'likely_active'
            }
          }

        } else {
          console.log(`    ❌ Failed: ${result.error}`)
        }

        questionResults.push(result)

        // Small delay between iterations
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      envResults.push({
        question,
        questionIndex: questionIndex + 1,
        iterations: questionResults
      })
    }

    return envResults
  }

  calculateStats(results) {
    const successfulResults = results.flatMap(q =>
      q.iterations.filter(i => i.success && !i.cacheHit)
    )

    if (successfulResults.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 }
    }

    const times = successfulResults.map(r => r.duration)

    return {
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      count: times.length,
      contextUsedCount: successfulResults.filter(r => r.contextUsed).length
    }
  }

  async run() {
    console.log('🎯 Starting pgvector Performance Benchmark')
    console.log('=' * 60)

    try {
      // Test both environments
      this.results.localhost = await this.benchmarkEnvironment(LOCALHOST_URL, 'Localhost')
      this.results.production = await this.benchmarkEnvironment(PRODUCTION_URL, 'Production')

      // Calculate statistics
      const localhostStats = this.calculateStats(this.results.localhost)
      const productionStats = this.calculateStats(this.results.production)

      this.results.comparison = {
        localhost: localhostStats,
        production: productionStats,
        improvement: {
          avgTimeDiff: productionStats.avg - localhostStats.avg,
          percentageDiff: localhostStats.avg > 0 ?
            ((productionStats.avg - localhostStats.avg) / localhostStats.avg * 100) : 0
        }
      }

      // Display results
      this.displayResults()

      // Save detailed results
      const filename = `benchmark-pgvector-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      writeFileSync(filename, JSON.stringify(this.results, null, 2))
      console.log(`\n💾 Detailed results saved to: ${filename}`)

    } catch (error) {
      console.error('❌ Benchmark failed:', error)
      process.exit(1)
    }
  }

  displayResults() {
    console.log('\n' + '=' * 60)
    console.log('🏆 BENCHMARK RESULTS')
    console.log('=' * 60)

    const { localhost, production, improvement } = this.results.comparison

    console.log('\n📊 Performance Summary:')
    console.log(`  Localhost:   ${localhost.avg.toFixed(0)}ms avg (${localhost.count} valid samples)`)
    console.log(`  Production:  ${production.avg.toFixed(0)}ms avg (${production.count} valid samples)`)
    console.log(`  Difference:  ${improvement.avgTimeDiff > 0 ? '+' : ''}${improvement.avgTimeDiff.toFixed(0)}ms (${improvement.percentageDiff.toFixed(1)}%)`)

    console.log('\n🔍 Context Usage:')
    console.log(`  Localhost:   ${localhost.contextUsedCount}/${localhost.count} queries found documents`)
    console.log(`  Production:  ${production.contextUsedCount}/${production.count} queries found documents`)

    console.log('\n⚡ pgvector Status:')
    console.log(`  Localhost:   ${this.results.metadata.pgvectorStatus.localhost}`)
    console.log(`  Production:  ${this.results.metadata.pgvectorStatus.production}`)

    if (improvement.percentageDiff < -10) {
      console.log('\n🎉 Localhost is significantly faster!')
    } else if (improvement.percentageDiff > 10) {
      console.log('\n🚀 Production is significantly faster!')
    } else {
      console.log('\n⚖️  Performance is similar between environments')
    }

    console.log('\n' + '=' * 60)
  }
}

// Run the benchmark
if (import.meta.url === `file://${process.argv[1]}`) {
  const benchmark = new PgvectorBenchmark()
  benchmark.run().catch(console.error)
}