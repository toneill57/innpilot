#!/usr/bin/env node

/**
 * Quick Benchmark: Localhost vs Vercel pgvector Performance
 * Single iteration per question for faster results
 */

import { performance } from 'perf_hooks'

const LOCALHOST_URL = 'http://localhost:3000'
const PRODUCTION_URL = 'https://innpilot.vercel.app'

// 5 optimized questions that should find relevant documents
const benchmarkQuestions = [
  "¿Cuáles son exactamente los 13 campos obligatorios que debo incluir en mi archivo SIRE?",
  "¿Qué códigos de documento son válidos para extranjeros en el sistema SIRE de Colombia?",
  "¿Cuál es el formato preciso requerido para las fechas en los archivos SIRE?",
  "¿Qué validaciones específicas realiza el sistema al procesar un archivo de huéspedes?",
  "¿Cuáles son los pasos oficiales para reportar correctamente la información al SIRE?"
]

class QuickBenchmark {
  async makeRequest(url, question) {
    const startTime = performance.now()

    try {
      const response = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })

      const endTime = performance.now()
      const data = await response.json()

      return {
        success: true,
        duration: endTime - startTime,
        contextUsed: data.context_used || false,
        cacheHit: data.performance?.cache_hit || false,
        totalTime: data.performance?.total_time_ms || null
      }

    } catch (error) {
      return {
        success: false,
        duration: performance.now() - startTime,
        error: error.message
      }
    }
  }

  async clearCache(url) {
    try {
      await this.makeRequest(url, `Cache clear ${Math.random()}`)
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (e) {
      // Ignore cache clear errors
    }
  }

  async testEnvironment(url, name) {
    console.log(`\n🚀 Testing ${name} (${url})`)
    const results = []

    for (let i = 0; i < benchmarkQuestions.length; i++) {
      const question = benchmarkQuestions[i]
      console.log(`  📝 Question ${i + 1}/5: "${question.substring(0, 50)}..."`)

      // Clear cache
      await this.clearCache(url)

      // Make request
      const result = await this.makeRequest(url, question)

      if (result.success && !result.cacheHit) {
        console.log(`    ✅ ${result.duration.toFixed(0)}ms - Context: ${result.contextUsed ? 'YES' : 'NO'}`)
        results.push(result)
      } else {
        console.log(`    ❌ Failed or cache hit`)
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return results
  }

  calculateStats(results) {
    if (results.length === 0) return { avg: 0, min: 0, max: 0, count: 0 }

    const times = results.map(r => r.duration)
    return {
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      count: times.length,
      contextCount: results.filter(r => r.contextUsed).length
    }
  }

  async run() {
    console.log('🎯 Quick pgvector Performance Benchmark')
    console.log('=' * 50)

    try {
      // Test both environments
      const localhostResults = await this.testEnvironment(LOCALHOST_URL, 'Localhost')
      const productionResults = await this.testEnvironment(PRODUCTION_URL, 'Production')

      // Calculate stats
      const localhostStats = this.calculateStats(localhostResults)
      const productionStats = this.calculateStats(productionResults)

      // Display results
      console.log('\n' + '=' * 50)
      console.log('🏆 QUICK BENCHMARK RESULTS')
      console.log('=' * 50)

      console.log('\n📊 Performance Summary:')
      console.log(`  Localhost:   ${localhostStats.avg.toFixed(0)}ms avg (${localhostStats.count} samples)`)
      console.log(`  Production:  ${productionStats.avg.toFixed(0)}ms avg (${productionStats.count} samples)`)

      if (localhostStats.avg > 0 && productionStats.avg > 0) {
        const diff = productionStats.avg - localhostStats.avg
        const pct = (diff / localhostStats.avg * 100)
        console.log(`  Difference:  ${diff > 0 ? '+' : ''}${diff.toFixed(0)}ms (${pct.toFixed(1)}%)`)
      }

      console.log('\n🔍 Context Usage:')
      console.log(`  Localhost:   ${localhostStats.contextCount}/${localhostStats.count} found documents`)
      console.log(`  Production:  ${productionStats.contextCount}/${productionStats.count} found documents`)

      console.log('\n⚡ Performance Analysis:')
      if (localhostStats.avg > 0 && productionStats.avg > 0) {
        if (Math.abs(productionStats.avg - localhostStats.avg) < 500) {
          console.log('  📊 Both environments show similar performance')
          console.log('  🎯 Likely both using pgvector optimization')
        } else if (productionStats.avg < localhostStats.avg) {
          console.log('  🚀 Production is faster - possible better optimization')
        } else {
          console.log('  🏠 Localhost is faster - local network advantage')
        }
      }

      console.log('\n' + '=' * 50)

    } catch (error) {
      console.error('❌ Benchmark failed:', error)
      process.exit(1)
    }
  }
}

// Run the benchmark
if (import.meta.url === `file://${process.argv[1]}`) {
  const benchmark = new QuickBenchmark()
  benchmark.run().catch(console.error)
}