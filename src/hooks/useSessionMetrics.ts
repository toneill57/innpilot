import { useState, useEffect, useCallback } from 'react'
import {
  SessionMetrics,
  QuerySnapshot,
  ChatMessage,
} from '@/components/Chat/shared/types'

const STORAGE_KEY = 'premium-chat-dev-session'

/**
 * Hook for managing session metrics in development mode
 * Tracks all queries, accumulates stats, and provides export functionality
 */
export function useSessionMetrics() {
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          return {
            ...parsed,
            sessionStart: new Date(parsed.sessionStart),
            queries: parsed.queries.map((q: any) => ({
              ...q,
              timestamp: new Date(q.timestamp),
            })),
          }
        }
      } catch (error) {
        console.error('[Session Metrics] Error loading from localStorage:', error)
      }
    }

    // Default fresh session
    return {
      sessionId: `session-${Date.now()}`,
      sessionStart: new Date(),
      totalQueries: 0,
      totalTokens: 0,
      totalCost: 0,
      totalTime: 0,
      avgResponseTime: 0,
      avgSimilarity: 0,
      avgResultsPerQuery: 0,
      tierUsage: {},
      searchTypeDistribution: {},
      queries: [],
    }
  })

  // Persist to localStorage whenever metrics change
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionMetrics.totalQueries > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionMetrics))
      } catch (error) {
        console.error('[Session Metrics] Error saving to localStorage:', error)
      }
    }
  }, [sessionMetrics])

  /**
   * Add a query to the session metrics
   * @param message - The assistant message with metrics
   */
  const addQuery = useCallback((message: ChatMessage) => {
    if (!message.metrics) {
      console.warn('[Session Metrics] Message missing metrics, skipping')
      return
    }

    setSessionMetrics((prev) => {
      const newQuery: QuerySnapshot = {
        id: message.id,
        timestamp: message.timestamp,
        query:
          message.role === 'user'
            ? message.content
            : '', // We'll need the user message too
        tokens: message.metrics!.tokens,
        performance: message.metrics!.performance,
        analysis: message.metrics!.analysis,
        quality: message.metrics!.quality,
        response: message.role === 'assistant' ? message.content : '',
        sources: message.sources || [],
      }

      const updatedQueries = [...prev.queries, newQuery]
      const totalQueries = prev.totalQueries + 1

      // Calculate accumulated metrics
      const totalTokens = prev.totalTokens + message.metrics!.tokens.embeddingTokens
      const totalCost = prev.totalCost + message.metrics!.tokens.embeddingCost
      const totalTime = prev.totalTime + message.metrics!.performance.responseTime

      // Calculate averages
      const avgResponseTime = totalTime / totalQueries
      const avgSimilarity =
        updatedQueries.reduce((sum, q) => sum + q.performance.avgSimilarityScore, 0) /
        updatedQueries.length
      const avgResultsPerQuery =
        updatedQueries.reduce((sum, q) => sum + q.performance.resultsCount, 0) /
        updatedQueries.length

      // Update tier usage
      const tierUsage = {
        ...prev.tierUsage,
        [message.metrics!.performance.tier]:
          (prev.tierUsage[message.metrics!.performance.tier] || 0) + 1,
      }

      // Update search type distribution
      const searchTypeDistribution = {
        ...prev.searchTypeDistribution,
        [message.metrics!.analysis.detectedType]:
          (prev.searchTypeDistribution[message.metrics!.analysis.detectedType] || 0) + 1,
      }

      const newMetrics: SessionMetrics = {
        ...prev,
        totalQueries,
        totalTokens,
        totalCost,
        totalTime,
        avgResponseTime,
        avgSimilarity,
        avgResultsPerQuery,
        tierUsage,
        searchTypeDistribution,
        queries: updatedQueries,
      }

      return newMetrics
    })
  }, [])

  /**
   * Reset the session metrics to a fresh state
   */
  const resetSession = useCallback(() => {
    const newSession: SessionMetrics = {
      sessionId: `session-${Date.now()}`,
      sessionStart: new Date(),
      totalQueries: 0,
      totalTokens: 0,
      totalCost: 0,
      totalTime: 0,
      avgResponseTime: 0,
      avgSimilarity: 0,
      avgResultsPerQuery: 0,
      tierUsage: {},
      searchTypeDistribution: {},
      queries: [],
    }
    setSessionMetrics(newSession)

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  /**
   * Export session data to JSON or CSV
   * @param format - Export format ('json' or 'csv')
   */
  const exportSession = useCallback(
    (format: 'json' | 'csv') => {
      if (sessionMetrics.totalQueries === 0) {
        alert('No queries to export')
        return
      }

      try {
        if (format === 'json') {
          // JSON export - complete data
          const blob = new Blob([JSON.stringify(sessionMetrics, null, 2)], {
            type: 'application/json',
          })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `premium-chat-session-${sessionMetrics.sessionId}.json`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        } else {
          // CSV export - simplified for spreadsheet analysis
          const headers = [
            'Query',
            'Tokens',
            'Cost (USD)',
            'Time (ms)',
            'Tier',
            'Type',
            'Complexity',
            'Avg Similarity',
            'Results',
            'Efficiency',
          ].join(',')

          const rows = sessionMetrics.queries.map((q) =>
            [
              `"${q.query.replace(/"/g, '""')}"`, // Escape quotes in query
              q.tokens.embeddingTokens,
              q.tokens.embeddingCost.toFixed(8),
              q.performance.responseTime,
              `"${q.performance.tier}"`,
              q.analysis.detectedType,
              q.analysis.complexity,
              q.performance.avgSimilarityScore.toFixed(3),
              q.performance.resultsCount,
              q.performance.tierEfficiency.toFixed(3),
            ].join(',')
          )

          const csv = [headers, ...rows].join('\n')

          const blob = new Blob([csv], { type: 'text/csv' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `premium-chat-session-${sessionMetrics.sessionId}.csv`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }

        console.log(`[Session Metrics] Exported ${format.toUpperCase()} successfully`)
      } catch (error) {
        console.error('[Session Metrics] Export error:', error)
        alert(`Failed to export ${format.toUpperCase()}. Check console for details.`)
      }
    },
    [sessionMetrics]
  )

  /**
   * Get performance comparison vs benchmarks
   */
  const getPerformanceComparison = useCallback(() => {
    if (sessionMetrics.totalQueries === 0) {
      return null
    }

    // From benchmark report
    const PRODUCTION_AVG = 8144 // Chat Assistant avg
    const VECTOR_SEARCH_AVG = 1840 // Vector Search avg (from benchmark)

    const improvement = PRODUCTION_AVG - sessionMetrics.avgResponseTime
    const improvementPercent = (improvement / PRODUCTION_AVG) * 100

    const vsVectorSearch = sessionMetrics.avgResponseTime - VECTOR_SEARCH_AVG
    const vsVectorSearchPercent = (vsVectorSearch / VECTOR_SEARCH_AVG) * 100

    return {
      avgResponseTime: sessionMetrics.avgResponseTime,
      productionAvg: PRODUCTION_AVG,
      vectorSearchAvg: VECTOR_SEARCH_AVG,
      improvement,
      improvementPercent,
      vsVectorSearch,
      vsVectorSearchPercent,
      isFasterThanProduction: improvementPercent > 0,
      isFasterThanBenchmark: vsVectorSearch < 0,
    }
  }, [sessionMetrics])

  /**
   * Get cost projections for different query volumes
   */
  const getCostProjections = useCallback(() => {
    if (sessionMetrics.totalQueries === 0) {
      return null
    }

    const costPerQuery = sessionMetrics.totalCost / sessionMetrics.totalQueries

    return {
      costPerQuery,
      per100: costPerQuery * 100,
      per1K: costPerQuery * 1000,
      per10K: costPerQuery * 10000,
      per100K: costPerQuery * 100000,
      per1M: costPerQuery * 1000000,
    }
  }, [sessionMetrics])

  return {
    sessionMetrics,
    addQuery,
    resetSession,
    exportSession,
    getPerformanceComparison,
    getCostProjections,
  }
}