/**
 * Count tokens in a text string using approximation
 * Note: This is an estimation. For exact counts, tiktoken can be used
 * but requires additional setup in Next.js environment.
 *
 * Approximation: 1 token ≈ 4 characters (conservative estimate)
 * This is accurate within 10-20% for most English text
 *
 * @param text - The text to count tokens for
 * @returns Estimated number of tokens
 */
export function countTokens(text: string): number {
  try {
    // Approximation method:
    // - 1 token ≈ 4 characters for English text
    // - Adjust for whitespace (whitespace is typically cheaper)
    const chars = text.length
    const words = text.trim().split(/\s+/).length

    // Better approximation: avg 1.3 tokens per word
    // Fall back to character-based if word count seems off
    if (words > 0 && words < chars) {
      return Math.ceil(words * 1.3)
    }

    // Character-based fallback
    return Math.ceil(chars / 4)
  } catch (error) {
    console.error('[Token Counter] Error counting tokens:', error)
    // Ultimate fallback
    return Math.ceil(text.length / 4)
  }
}

/**
 * Calculate embedding cost based on OpenAI pricing
 * text-embedding-3-large: $0.13 per 1M tokens
 * @param tokens - Number of tokens
 * @returns Cost in USD
 */
export function calculateEmbeddingCost(tokens: number): number {
  const COST_PER_TOKEN = 0.00000013 // $0.13 per 1M tokens
  return tokens * COST_PER_TOKEN
}

/**
 * Determine query complexity based on word count and keywords matched
 * @param query - The query string
 * @param keywordsMatched - Number of keywords matched
 * @returns Complexity level
 */
export function getComplexityScore(
  query: string,
  keywordsMatched: number
): 'simple' | 'moderate' | 'complex' {
  const wordCount = query.trim().split(/\s+/).length

  // Simple: Short queries with few keywords
  if (wordCount <= 5 && keywordsMatched <= 2) {
    return 'simple'
  }

  // Moderate: Medium queries with moderate keywords
  if (wordCount <= 15 && keywordsMatched <= 5) {
    return 'moderate'
  }

  // Complex: Long queries or many keywords
  return 'complex'
}

/**
 * Calculate routing confidence based on keyword distribution
 * Higher confidence when keywords clearly point to one type
 * @param detectedType - The detected search type
 * @param accommodationCount - Number of accommodation keywords matched
 * @param tourismCount - Number of tourism keywords matched
 * @returns Confidence score (0-1)
 */
export function calculateRoutingConfidence(
  detectedType: 'accommodation' | 'tourism' | 'both',
  accommodationCount: number,
  tourismCount: number
): number {
  const totalKeywords = accommodationCount + tourismCount

  // No keywords matched - low confidence
  if (totalKeywords === 0) {
    return 0.3
  }

  // Both type - confidence based on balance
  if (detectedType === 'both') {
    // If perfectly balanced, medium confidence
    const diff = Math.abs(accommodationCount - tourismCount)
    const balanceScore = 1 - (diff / totalKeywords)
    return 0.5 + (balanceScore * 0.3) // 0.5-0.8 range
  }

  // Single type - confidence based on dominance
  const dominantCount = Math.max(accommodationCount, tourismCount)
  const dominanceRatio = dominantCount / totalKeywords

  // High dominance (>80%) = high confidence
  // Low dominance (50-80%) = medium confidence
  return Math.min(0.5 + (dominanceRatio * 0.5), 1.0)
}

/**
 * Estimate tokens for a query (fast approximation without tiktoken)
 * Useful for client-side estimation
 * @param text - The text to estimate
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters (conservative)
  return Math.ceil(text.length / 4)
}

/**
 * Format cost for display
 * @param cost - Cost in USD
 * @param decimals - Number of decimal places (default: 6)
 * @returns Formatted cost string
 */
export function formatCost(cost: number, decimals: number = 6): string {
  return `$${cost.toFixed(decimals)}`
}

/**
 * Calculate projected costs for different query volumes
 * @param costPerQuery - Cost per single query
 * @returns Projected costs object
 */
export function calculateProjectedCosts(costPerQuery: number) {
  return {
    per100: costPerQuery * 100,
    per1K: costPerQuery * 1000,
    per10K: costPerQuery * 10000,
    per100K: costPerQuery * 100000,
    per1M: costPerQuery * 1000000,
  }
}

/**
 * Compare costs between Vector Search and Chat Assistant
 * @param vectorSearchCost - Cost of vector search (embeddings only)
 * @returns Comparison object
 */
export function compareCosts(vectorSearchCost: number) {
  // Chat Assistant uses embeddings + Claude Haiku
  // Embeddings: ~$0.0000065 per query
  // Claude Haiku: ~$0.000125 per query (500 tokens avg at $0.25/1M input tokens)
  const chatAssistantCost = vectorSearchCost + 0.000125

  const savings = chatAssistantCost - vectorSearchCost
  const savingsPercent = (savings / chatAssistantCost) * 100

  return {
    vectorSearchCost,
    chatAssistantCost,
    savings,
    savingsPercent,
    speedImprovement: 77.4, // From benchmark report
  }
}