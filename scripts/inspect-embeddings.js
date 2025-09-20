#!/usr/bin/env node

/**
 * EMBEDDINGS INSPECTION SCRIPT
 *
 * Herramienta de diagnóstico avanzada para analizar la calidad de embeddings
 * en ambas tablas (document_embeddings y muva_embeddings) y detectar problemas
 * de chunking, cortes inadecuados y inconsistencias.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables
config({ path: '.env.local' })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Color codes for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`
}

/**
 * Analyze chunk quality issues
 */
function analyzeChunkQuality(chunks) {
  const issues = []
  const stats = {
    totalChunks: chunks.length,
    avgLength: 0,
    minLength: Infinity,
    maxLength: 0,
    cutsInWords: 0,
    incompleteStarts: 0,
    incompleteEnds: 0,
    tooShort: 0,
    tooLong: 0
  }

  let totalLength = 0

  chunks.forEach((chunk, index) => {
    const content = chunk.content
    const length = content.length

    totalLength += length
    stats.minLength = Math.min(stats.minLength, length)
    stats.maxLength = Math.max(stats.maxLength, length)

    // Check for cuts in middle of words
    if (content.match(/\w$/)) {
      stats.incompleteEnds++
      issues.push({
        type: 'WORD_CUT_END',
        severity: 'HIGH',
        chunkIndex: index,
        sourceFile: chunk.source_file,
        issue: `Chunk ends mid-word: "${content.substring(content.length - 20)}"`
      })
    }

    // Check for incomplete sentence starts
    if (content.match(/^[a-z]/)) {
      stats.incompleteStarts++
      issues.push({
        type: 'INCOMPLETE_START',
        severity: 'MEDIUM',
        chunkIndex: index,
        sourceFile: chunk.source_file,
        issue: `Chunk starts mid-sentence: "${content.substring(0, 50)}..."`
      })
    }

    // Check chunk size issues
    if (length < 100) {
      stats.tooShort++
      issues.push({
        type: 'TOO_SHORT',
        severity: 'LOW',
        chunkIndex: index,
        sourceFile: chunk.source_file,
        issue: `Chunk too short (${length} chars)`
      })
    }

    if (length > 1200) {
      stats.tooLong++
      issues.push({
        type: 'TOO_LONG',
        severity: 'MEDIUM',
        chunkIndex: index,
        sourceFile: chunk.source_file,
        issue: `Chunk too long (${length} chars)`
      })
    }

    // Check for abrupt cuts (ending without punctuation)
    if (!content.match(/[.!?;]\s*$/)) {
      issues.push({
        type: 'ABRUPT_CUT',
        severity: 'MEDIUM',
        chunkIndex: index,
        sourceFile: chunk.source_file,
        issue: `Chunk ends abruptly without punctuation`
      })
    }
  })

  stats.avgLength = Math.round(totalLength / chunks.length)

  return { issues, stats }
}

/**
 * Inspect SIRE embeddings (document_embeddings)
 */
async function inspectSireEmbeddings() {
  console.log(colorize('\n📋 INSPECTING SIRE EMBEDDINGS (document_embeddings)', 'blue'))
  console.log('=' .repeat(60))

  try {
    const { data: chunks, error } = await supabase
      .from('document_embeddings')
      .select('id, content, source_file, chunk_index, total_chunks, document_type, created_at')
      .order('source_file', { ascending: true })
      .order('chunk_index', { ascending: true })

    if (error) {
      console.error(colorize('❌ Error fetching SIRE embeddings:', 'red'), error.message)
      return
    }

    if (!chunks || chunks.length === 0) {
      console.log(colorize('⚠️  No SIRE embeddings found', 'yellow'))
      return
    }

    console.log(colorize(`✅ Found ${chunks.length} SIRE chunks`, 'green'))

    // Analyze quality
    const { issues, stats } = analyzeChunkQuality(chunks)

    // Display statistics
    console.log(colorize('\n📊 STATISTICS:', 'cyan'))
    console.log(`   Total chunks: ${stats.totalChunks}`)
    console.log(`   Average length: ${stats.avgLength} chars`)
    console.log(`   Length range: ${stats.minLength} - ${stats.maxLength} chars`)
    console.log(`   Quality issues: ${issues.length}`)

    // Display issues by severity
    const issuesBySeverity = issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1
      return acc
    }, {})

    console.log(colorize('\n🔍 ISSUES BY SEVERITY:', 'cyan'))
    Object.entries(issuesBySeverity).forEach(([severity, count]) => {
      const color = severity === 'HIGH' ? 'red' : severity === 'MEDIUM' ? 'yellow' : 'white'
      console.log(colorize(`   ${severity}: ${count}`, color))
    })

    // Display top issues
    const topIssues = issues
      .filter(issue => issue.severity === 'HIGH')
      .slice(0, 5)

    if (topIssues.length > 0) {
      console.log(colorize('\n🚨 TOP HIGH-SEVERITY ISSUES:', 'red'))
      topIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.sourceFile} (chunk ${issue.chunkIndex}): ${issue.issue}`)
      })
    }

    // Files with most issues
    const fileIssues = issues.reduce((acc, issue) => {
      acc[issue.sourceFile] = (acc[issue.sourceFile] || 0) + 1
      return acc
    }, {})

    const topFiles = Object.entries(fileIssues)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)

    if (topFiles.length > 0) {
      console.log(colorize('\n📁 FILES WITH MOST ISSUES:', 'yellow'))
      topFiles.forEach(([file, count], index) => {
        console.log(`   ${index + 1}. ${file}: ${count} issues`)
      })
    }

    return { domain: 'SIRE', chunks: chunks.length, issues: issues.length, stats }

  } catch (error) {
    console.error(colorize('❌ Error inspecting SIRE embeddings:', 'red'), error.message)
  }
}

/**
 * Inspect MUVA embeddings (muva_embeddings)
 */
async function inspectMuvaEmbeddings() {
  console.log(colorize('\n🏝️  INSPECTING MUVA EMBEDDINGS (muva_embeddings)', 'blue'))
  console.log('=' .repeat(60))

  try {
    const { data: chunks, error } = await supabase
      .from('muva_embeddings')
      .select('id, content, source_file, chunk_index, total_chunks, category, created_at')
      .order('source_file', { ascending: true })
      .order('chunk_index', { ascending: true })

    if (error) {
      console.error(colorize('❌ Error fetching MUVA embeddings:', 'red'), error.message)
      return
    }

    if (!chunks || chunks.length === 0) {
      console.log(colorize('⚠️  No MUVA embeddings found', 'yellow'))
      return
    }

    console.log(colorize(`✅ Found ${chunks.length} MUVA chunks`, 'green'))

    // Analyze quality
    const { issues, stats } = analyzeChunkQuality(chunks)

    // Display statistics
    console.log(colorize('\n📊 STATISTICS:', 'cyan'))
    console.log(`   Total chunks: ${stats.totalChunks}`)
    console.log(`   Average length: ${stats.avgLength} chars`)
    console.log(`   Length range: ${stats.minLength} - ${stats.maxLength} chars`)
    console.log(`   Quality issues: ${issues.length}`)

    // Business type distribution
    const businessTypes = chunks.reduce((acc, chunk) => {
      const type = chunk.category || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    console.log(colorize('\n🏢 BUSINESS TYPE DISTRIBUTION:', 'cyan'))
    Object.entries(businessTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} chunks`)
    })

    // Display issues by severity
    const issuesBySeverity = issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1
      return acc
    }, {})

    console.log(colorize('\n🔍 ISSUES BY SEVERITY:', 'cyan'))
    Object.entries(issuesBySeverity).forEach(([severity, count]) => {
      const color = severity === 'HIGH' ? 'red' : severity === 'MEDIUM' ? 'yellow' : 'white'
      console.log(colorize(`   ${severity}: ${count}`, color))
    })

    return { domain: 'MUVA', chunks: chunks.length, issues: issues.length, stats }

  } catch (error) {
    console.error(colorize('❌ Error inspecting MUVA embeddings:', 'red'), error.message)
  }
}

/**
 * Compare embeddings between domains
 */
async function compareEmbeddings() {
  console.log(colorize('\n🔄 COMPARING SIRE vs MUVA EMBEDDINGS', 'magenta'))
  console.log('=' .repeat(60))

  const sireResults = await inspectSireEmbeddings()
  const muvaResults = await inspectMuvaEmbeddings()

  if (!sireResults || !muvaResults) {
    console.log(colorize('⚠️  Cannot compare - missing data from one or both domains', 'yellow'))
    return
  }

  console.log(colorize('\n📊 DOMAIN COMPARISON:', 'cyan'))
  console.log(`   SIRE: ${sireResults.chunks} chunks, ${sireResults.issues} issues`)
  console.log(`   MUVA: ${muvaResults.chunks} chunks, ${muvaResults.issues} issues`)

  const sireQuality = Math.round((1 - sireResults.issues / sireResults.chunks) * 100)
  const muvaQuality = Math.round((1 - muvaResults.issues / muvaResults.chunks) * 100)

  console.log(colorize('\n🎯 QUALITY SCORES:', 'cyan'))
  console.log(`   SIRE Quality: ${sireQuality}%`)
  console.log(`   MUVA Quality: ${muvaQuality}%`)

  if (sireQuality > muvaQuality) {
    console.log(colorize('   → SIRE has better chunk quality', 'green'))
  } else if (muvaQuality > sireQuality) {
    console.log(colorize('   → MUVA has better chunk quality', 'green'))
  } else {
    console.log(colorize('   → Both domains have similar quality', 'white'))
  }

  console.log(colorize('\n📈 STATISTICS COMPARISON:', 'cyan'))
  console.log(`   Average chunk length: SIRE ${sireResults.stats.avgLength} vs MUVA ${muvaResults.stats.avgLength}`)
  console.log(`   Size variation: SIRE ${sireResults.stats.maxLength - sireResults.stats.minLength} vs MUVA ${muvaResults.stats.maxLength - muvaResults.stats.minLength}`)
}

/**
 * Generate report file
 */
async function generateReport() {
  console.log(colorize('\n📝 GENERATING DETAILED REPORT...', 'cyan'))

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const reportPath = path.join(process.cwd(), `embeddings-inspection-report-${timestamp}.json`)

  try {
    // Fetch all data
    const { data: sireChunks } = await supabase
      .from('document_embeddings')
      .select('*')

    const { data: muvaChunks } = await supabase
      .from('muva_embeddings')
      .select('*')

    // Analyze both
    const sireAnalysis = analyzeChunkQuality(sireChunks || [])
    const muvaAnalysis = analyzeChunkQuality(muvaChunks || [])

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        sire: {
          totalChunks: sireChunks?.length || 0,
          totalIssues: sireAnalysis.issues.length,
          qualityScore: Math.round((1 - sireAnalysis.issues.length / (sireChunks?.length || 1)) * 100),
          stats: sireAnalysis.stats
        },
        muva: {
          totalChunks: muvaChunks?.length || 0,
          totalIssues: muvaAnalysis.issues.length,
          qualityScore: Math.round((1 - muvaAnalysis.issues.length / (muvaChunks?.length || 1)) * 100),
          stats: muvaAnalysis.stats
        }
      },
      issues: {
        sire: sireAnalysis.issues,
        muva: muvaAnalysis.issues
      },
      recommendations: generateRecommendations(sireAnalysis, muvaAnalysis)
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(colorize(`✅ Report generated: ${reportPath}`, 'green'))

  } catch (error) {
    console.error(colorize('❌ Error generating report:', 'red'), error.message)
  }
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(sireAnalysis, muvaAnalysis) {
  const recommendations = []

  // Check for high word cut issues
  const sireWordCuts = sireAnalysis.issues.filter(i => i.type === 'WORD_CUT_END').length
  const muvaWordCuts = muvaAnalysis.issues.filter(i => i.type === 'WORD_CUT_END').length

  if (sireWordCuts > 0 || muvaWordCuts > 0) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Word cuts detected',
      solution: 'Implement better word boundary detection in chunking algorithm',
      affectedDomains: [
        ...(sireWordCuts > 0 ? ['SIRE'] : []),
        ...(muvaWordCuts > 0 ? ['MUVA'] : [])
      ]
    })
  }

  // Check for size consistency
  if (sireAnalysis.stats.maxLength - sireAnalysis.stats.minLength > 800) {
    recommendations.push({
      priority: 'MEDIUM',
      issue: 'High variation in SIRE chunk sizes',
      solution: 'Adjust chunk size configuration for more consistent chunks',
      affectedDomains: ['SIRE']
    })
  }

  // Overall quality recommendations
  const sireQuality = 1 - sireAnalysis.issues.length / sireAnalysis.stats.totalChunks
  const muvaQuality = 1 - muvaAnalysis.issues.length / muvaAnalysis.stats.totalChunks

  if (sireQuality < 0.8 || muvaQuality < 0.8) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Overall chunk quality below 80%',
      solution: 'Consider using the unified-embeddings.js script with improved semantic validation',
      affectedDomains: ['SIRE', 'MUVA']
    })
  }

  return recommendations
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)
  const domain = args.find(arg => arg.startsWith('--domain='))?.split('=')[1]

  console.log(colorize('🔍 EMBEDDINGS INSPECTION TOOL', 'bold'))
  console.log(colorize('=' .repeat(60), 'cyan'))

  if (args.includes('--help')) {
    console.log('\nUsage:')
    console.log('  node scripts/inspect-embeddings.js [options]')
    console.log('\nOptions:')
    console.log('  --domain=SIRE     Inspect only SIRE embeddings')
    console.log('  --domain=MUVA     Inspect only MUVA embeddings')
    console.log('  --compare         Compare both domains')
    console.log('  --report          Generate detailed JSON report')
    console.log('  --help            Show this help message')
    return
  }

  try {
    if (domain === 'SIRE') {
      await inspectSireEmbeddings()
    } else if (domain === 'MUVA') {
      await inspectMuvaEmbeddings()
    } else if (args.includes('--compare')) {
      await compareEmbeddings()
    } else if (args.includes('--report')) {
      await generateReport()
    } else {
      // Default: inspect both domains
      await inspectSireEmbeddings()
      await inspectMuvaEmbeddings()
      await compareEmbeddings()
    }

    console.log(colorize('\n✅ Inspection completed!', 'green'))
    console.log(colorize('\nNext steps:', 'cyan'))
    console.log('  • Run with --report to generate detailed JSON report')
    console.log('  • Use scripts/unified-embeddings.js to re-process problematic files')
    console.log('  • Consider adjusting chunk size configuration in src/lib/chunking.ts')

  } catch (error) {
    console.error(colorize('❌ Fatal error:', 'red'), error.message)
    process.exit(1)
  }
}

// Run the script
main()