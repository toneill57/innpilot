/**
 * Quality Analysis for Vector Search Results
 * Provides comprehensive metrics about search result quality,
 * efficiency, and tier performance
 */

export interface QualityAnalysis {
  // Similarity metrics
  avgSimilarity: number
  topSimilarity: number

  // Source diversity
  sourceDiversity: number

  // Data quality
  duplicateCount: number
  responseLength: number

  // Efficiency metrics
  tokensPerResult: number
  timePerResult: number
  costPerResult: number

  // Tier performance
  tierEfficiency: number
}

/**
 * Analyze the quality of search results
 * @param results - Array of search results with similarity scores
 * @param responseText - Generated response text
 * @param tokens - Tokens used for the query
 * @param time - Total response time in ms
 * @param cost - Total cost in USD
 * @param tier - Tier used for the search
 * @returns Quality analysis object
 */
export function analyzeQuality(
  results: any[],
  responseText: string,
  tokens: number,
  time: number,
  cost: number,
  tier: string
): QualityAnalysis {
  // Handle empty results
  if (results.length === 0) {
    return {
      avgSimilarity: 0,
      topSimilarity: 0,
      sourceDiversity: 0,
      duplicateCount: 0,
      responseLength: responseText.length,
      tokensPerResult: tokens,
      timePerResult: time,
      costPerResult: cost,
      tierEfficiency: 0,
    }
  }

  // Calculate similarity metrics
  const similarities = results
    .map((r) => r.similarity || 0)
    .filter((s) => s > 0)

  const avgSimilarity =
    similarities.length > 0
      ? similarities.reduce((a, b) => a + b, 0) / similarities.length
      : 0

  const topSimilarity = similarities.length > 0 ? Math.max(...similarities) : 0

  // Calculate source diversity
  const uniqueSources = new Set(
    results.map((r) => {
      // Use name, type, or source_file to identify unique sources
      return r.name || r.type || r.source_file || 'unknown'
    })
  )
  const sourceDiversity =
    results.length > 0 ? uniqueSources.size / results.length : 0

  // Detect duplicates by name/content
  const names = results
    .map((r) => (r.name || r.content || '').toLowerCase().trim())
    .filter((n) => n.length > 0)
  const uniqueNames = new Set(names)
  const duplicateCount = names.length - uniqueNames.size

  // Calculate efficiency metrics
  const resultsCount = results.length || 1
  const tokensPerResult = tokens / resultsCount
  const timePerResult = time / resultsCount
  const costPerResult = cost / resultsCount

  // Calculate tier efficiency
  const tierEfficiency = calculateTierEfficiency(avgSimilarity, time, tier)

  return {
    avgSimilarity,
    topSimilarity,
    sourceDiversity,
    duplicateCount,
    responseLength: responseText.length,
    tokensPerResult,
    timePerResult,
    costPerResult,
    tierEfficiency,
  }
}

/**
 * Calculate tier efficiency score (0-1)
 * Higher score means the tier performed well for this query
 * Considers both similarity quality and response time
 *
 * @param similarity - Average similarity score
 * @param time - Response time in ms
 * @param tier - Tier name used
 * @returns Efficiency score (0-1)
 */
function calculateTierEfficiency(
  similarity: number,
  time: number,
  tier: string
): number {
  // Expected times from benchmark report (ms)
  const expectedTimes: Record<string, number> = {
    'Tier 1 (Ultra-fast) [DEV]': 2208,
    'Tier 1 (Ultra-fast)': 2208,
    'Tier 2 (Balanced) [DEV]': 1104,
    'Tier 2 (Balanced)': 1104,
    'Tier 3 (Full precision) [DEV]': 3000,
    'Tier 3 (Full precision)': 3000,
  }

  // Get expected time for this tier, default to 2000ms
  const expectedTime = expectedTimes[tier] || 2000

  // Calculate time score (better if faster than expected)
  // Score = 1.0 if at or below expected, decreases linearly
  const timeRatio = time / expectedTime
  const timeScore = Math.max(0, Math.min(1, 2 - timeRatio))

  // Similarity threshold for "good" matches
  // 0.7+ = excellent, 0.4-0.7 = good, <0.4 = poor
  const similarityScore = Math.min(similarity / 0.7, 1.0)

  // Combine scores: 70% similarity weight, 30% time weight
  // Similarity is more important than speed for quality
  const efficiency = similarityScore * 0.7 + timeScore * 0.3

  return Math.max(0, Math.min(1, efficiency))
}

/**
 * Categorize quality level based on metrics
 * @param analysis - Quality analysis object
 * @returns Quality level and color code
 */
export function categorizeQuality(analysis: QualityAnalysis): {
  level: 'excellent' | 'good' | 'fair' | 'poor'
  color: 'green' | 'yellow' | 'orange' | 'red'
  score: number
} {
  // Calculate overall quality score (0-100)
  const similarityScore = analysis.avgSimilarity * 100
  const efficiencyScore = analysis.tierEfficiency * 100
  const diversityScore = analysis.sourceDiversity * 100

  // Weighted average: similarity 50%, efficiency 30%, diversity 20%
  const overallScore =
    similarityScore * 0.5 + efficiencyScore * 0.3 + diversityScore * 0.2

  // Penalty for duplicates
  const duplicatePenalty = Math.min(analysis.duplicateCount * 5, 20)
  const finalScore = Math.max(0, overallScore - duplicatePenalty)

  // Categorize
  if (finalScore >= 80) {
    return { level: 'excellent', color: 'green', score: finalScore }
  } else if (finalScore >= 60) {
    return { level: 'good', color: 'yellow', score: finalScore }
  } else if (finalScore >= 40) {
    return { level: 'fair', color: 'orange', score: finalScore }
  } else {
    return { level: 'poor', color: 'red', score: finalScore }
  }
}

/**
 * Generate quality insights and recommendations
 * @param analysis - Quality analysis object
 * @returns Array of insight strings
 */
export function generateQualityInsights(
  analysis: QualityAnalysis
): string[] {
  const insights: string[] = []

  // Similarity insights
  if (analysis.avgSimilarity < 0.4) {
    insights.push(
      '⚠️ Low similarity scores - consider refining query or adjusting threshold'
    )
  } else if (analysis.avgSimilarity > 0.8) {
    insights.push('✅ Excellent similarity scores - very relevant results')
  }

  // Diversity insights
  if (analysis.sourceDiversity < 0.5) {
    insights.push(
      '📊 Low source diversity - results may be repetitive'
    )
  } else if (analysis.sourceDiversity > 0.8) {
    insights.push('✨ High source diversity - good variety of results')
  }

  // Duplicate insights
  if (analysis.duplicateCount > 0) {
    insights.push(
      `🔄 ${analysis.duplicateCount} duplicate result${analysis.duplicateCount > 1 ? 's' : ''} detected - may need deduplication`
    )
  }

  // Efficiency insights
  if (analysis.tierEfficiency < 0.5) {
    insights.push(
      '🐌 Low tier efficiency - consider using a different tier or optimizing query'
    )
  } else if (analysis.tierEfficiency > 0.8) {
    insights.push('🚀 Excellent tier efficiency - optimal performance')
  }

  // Cost insights
  if (analysis.costPerResult > 0.00001) {
    insights.push(
      '💰 Higher cost per result - consider tier optimization'
    )
  } else if (analysis.costPerResult < 0.000003) {
    insights.push('💚 Very cost-efficient results')
  }

  // Time insights
  if (analysis.timePerResult > 1000) {
    insights.push(
      '⏱️ Slow per-result time - may benefit from tier 1 or optimization'
    )
  } else if (analysis.timePerResult < 500) {
    insights.push('⚡ Fast per-result time - excellent performance')
  }

  // Default positive message if no issues
  if (insights.length === 0) {
    insights.push('✅ Good overall quality - no major issues detected')
  }

  return insights
}

/**
 * Compare quality between two analyses
 * Useful for A/B testing or comparing different approaches
 * @param current - Current analysis
 * @param baseline - Baseline analysis to compare against
 * @returns Comparison object
 */
export function compareQuality(
  current: QualityAnalysis,
  baseline: QualityAnalysis
) {
  const similarityDiff = current.avgSimilarity - baseline.avgSimilarity
  const efficiencyDiff = current.tierEfficiency - baseline.tierEfficiency
  const timeDiff = current.timePerResult - baseline.timePerResult
  const costDiff = current.costPerResult - baseline.costPerResult

  return {
    similarityChange: {
      value: similarityDiff,
      percent: (similarityDiff / baseline.avgSimilarity) * 100,
      improved: similarityDiff > 0,
    },
    efficiencyChange: {
      value: efficiencyDiff,
      percent: (efficiencyDiff / baseline.tierEfficiency) * 100,
      improved: efficiencyDiff > 0,
    },
    timeChange: {
      value: timeDiff,
      percent: (timeDiff / baseline.timePerResult) * 100,
      improved: timeDiff < 0, // Lower time is better
    },
    costChange: {
      value: costDiff,
      percent: (costDiff / baseline.costPerResult) * 100,
      improved: costDiff < 0, // Lower cost is better
    },
  }
}