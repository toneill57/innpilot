import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

// Track a query (called from chat API)
export async function POST(request: NextRequest) {
  try {
    const {
      query,
      category,
      location,
      city,
      semanticGroup,
      sessionId,
      filtersUsed,
      responseTimeMs,
      cacheHit,
      resultsFound,
      resultQuality,
      contextChunksUsed
    } = await request.json()

    if (!query || !sessionId) {
      return NextResponse.json(
        { error: 'Query and session ID are required' },
        { status: 400 }
      )
    }

    const now = new Date()

    console.log(`[MUVA Analytics] Tracking query: "${query.substring(0, 50)}..."`)

    const { data, error } = await supabase
      .from('muva_analytics')
      .insert({
        query,
        normalized_query: query.toLowerCase().trim(),
        category,
        location,
        city,
        semantic_group: semanticGroup,
        session_id: sessionId,
        user_agent: request.headers.get('user-agent') || undefined,
        filters_used: filtersUsed || {},
        response_time_ms: responseTimeMs,
        cache_hit: cacheHit || false,
        results_found: resultsFound || 0,
        result_quality: resultQuality || null,
        context_chunks_used: contextChunksUsed || 0,
        query_length: query.length,
        hour_of_day: now.getHours(),
        day_of_week: now.getDay(),
        timestamp: now.toISOString()
      })
      .select()

    if (error) {
      console.error('[MUVA Analytics] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to track query' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      analyticsId: data[0]?.id
    })

  } catch (error) {
    console.error('[MUVA Analytics] Error tracking query:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get analytics dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    const category = searchParams.get('category')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Base query
    let baseQuery = supabase
      .from('muva_analytics')
      .select('*')
      .gte('timestamp', startDate.toISOString())

    if (category) {
      baseQuery = baseQuery.eq('category', category)
    }

    // Execute queries in parallel
    const [
      { data: analytics, error: analyticsError },
      { data: popularQueries, error: popularError },
      { data: categoryStats, error: categoryError },
      { data: hourlyStats, error: hourlyError },
      { data: performanceStats, error: performanceError }
    ] = await Promise.all([
      // All analytics data
      baseQuery.order('timestamp', { ascending: false }),

      // Popular queries (we'll process this separately)
      supabase
        .from('muva_analytics')
        .select('normalized_query, category')
        .gte('timestamp', startDate.toISOString())
        .not('normalized_query', 'is', null)
        .limit(1000),

      // Category distribution (we'll process this separately)
      supabase
        .from('muva_analytics')
        .select('category')
        .gte('timestamp', startDate.toISOString())
        .not('category', 'is', null),

      // Hourly usage patterns (we'll process this separately)
      supabase
        .from('muva_analytics')
        .select('timestamp')
        .gte('timestamp', startDate.toISOString()),

      // Performance metrics
      supabase
        .from('muva_analytics')
        .select('response_time_ms, cache_hit, result_quality, results_found')
        .gte('timestamp', startDate.toISOString())
        .not('response_time_ms', 'is', null)
    ])

    if (analyticsError || popularError || categoryError || hourlyError || performanceError) {
      const errors = [analyticsError, popularError, categoryError, hourlyError, performanceError].filter(Boolean)
      console.error('[MUVA Analytics] Database errors:', errors)
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      )
    }

    // Calculate summary statistics
    const totalQueries = analytics?.length || 0
    const uniqueSessions = new Set(analytics?.map(a => a.session_id) || []).size

    const responseTimes = performanceStats?.map(p => p.response_time_ms).filter(Boolean) || []
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
      : 0

    const cacheHitRate = performanceStats?.length > 0
      ? Math.round((performanceStats.filter(p => p.cache_hit).length / performanceStats.length) * 100)
      : 0

    const qualityScores = performanceStats?.map(p => p.result_quality).filter(Boolean) || []
    const avgQuality = qualityScores.length > 0
      ? Math.round((qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length) * 100)
      : 0

    // Semantic group analysis
    const semanticGroups = analytics?.reduce((acc: Record<string, number>, a) => {
      if (a.semantic_group) {
        acc[a.semantic_group] = (acc[a.semantic_group] || 0) + 1
      }
      return acc
    }, {}) || {}

    // Process popular queries with counts
    const queryCount = popularQueries?.reduce((acc: Record<string, { count: number, category: string }>, pq) => {
      const key = pq.normalized_query
      if (key && acc[key]) {
        acc[key].count++
      } else if (key) {
        acc[key] = { count: 1, category: pq.category }
      }
      return acc
    }, {}) || {}

    const popularQueriesWithCount = Object.entries(queryCount)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 10)
      .map(([query, data]) => ({
        query,
        category: data.category,
        count: data.count
      }))

    // Process category distribution with counts
    const categoryCount = categoryStats?.reduce((acc: Record<string, number>, cs) => {
      if (cs.category) {
        acc[cs.category] = (acc[cs.category] || 0) + 1
      }
      return acc
    }, {}) || {}

    const categoryDistributionWithCount = Object.entries(categoryCount).map(([category, count]) => ({
      category,
      count,
      percentage: totalQueries > 0 ? Math.round((count / totalQueries) * 100) : 0
    }))

    // Process hourly usage with counts
    const hourlyCount = hourlyStats?.reduce((acc: Record<number, number>, hs) => {
      const hour = new Date(hs.timestamp).getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {}) || {}

    const hourlyUsageWithCount = Object.entries(hourlyCount).map(([hour, count]) => ({
      hour: parseInt(hour),
      count
    }))

    // Recent activity trends
    const last24Hours = analytics?.filter(a =>
      new Date(a.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ) || []

    return NextResponse.json({
      summary: {
        totalQueries,
        uniqueSessions,
        avgResponseTime,
        cacheHitRate,
        avgQuality,
        periodDays: days
      },
      popularQueries: popularQueriesWithCount,
      categoryDistribution: categoryDistributionWithCount,
      hourlyUsage: hourlyUsageWithCount,
      semanticGroups: Object.entries(semanticGroups).map(([group, count]) => ({
        group,
        count,
        percentage: totalQueries > 0 ? Math.round((count / totalQueries) * 100) : 0
      })).sort((a, b) => b.count - a.count),
      recentActivity: {
        last24Hours: last24Hours.length,
        trend: last24Hours.length > 0 ? 'active' : 'quiet'
      },
      topLocations: analytics?.reduce((acc: Record<string, number>, a) => {
        if (a.location) {
          acc[a.location] = (acc[a.location] || 0) + 1
        }
        return acc
      }, {}) || {}
    })

  } catch (error) {
    console.error('[MUVA Analytics] Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}