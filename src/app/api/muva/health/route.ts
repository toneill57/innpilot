import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

interface MuvaHealthStatus {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: {
    database: HealthCheck
    dataFreshness: HealthCheck
    embeddings: HealthCheck
    filterPerformance: HealthCheck
  }
  stats: {
    totalEmbeddings: number
    categoriesAvailable: string[]
    lastDataUpdate: string | null
    avgResponseTime: number
  }
  cache: {
    size: number
    hitRate: number
    lastCleared: string
  }
}

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime?: number
  message?: string
  error?: string
}

// Check MUVA embeddings table health
async function checkMuvaEmbeddings(): Promise<HealthCheck> {
  const start = performance.now()

  try {
    const { count, error } = await supabase
      .from('muva_embeddings')
      .select('*', { count: 'exact', head: true })

    const responseTime = Math.round(performance.now() - start)

    if (error) {
      return {
        status: 'unhealthy',
        responseTime,
        error: error.message
      }
    }

    if (count === 0) {
      return {
        status: 'degraded',
        responseTime,
        message: 'No tourism data available'
      }
    }

    return {
      status: 'healthy',
      responseTime,
      message: `${count} tourism records available`
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Math.round(performance.now() - start),
      error: error instanceof Error ? error.message : 'Database connection failed'
    }
  }
}

// Check data freshness
async function checkDataFreshness(): Promise<HealthCheck> {
  const start = performance.now()

  try {
    const { data, error } = await supabase
      .from('muva_embeddings')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)

    const responseTime = Math.round(performance.now() - start)

    if (error) {
      return {
        status: 'unhealthy',
        responseTime,
        error: error.message
      }
    }

    if (!data || data.length === 0) {
      return {
        status: 'unhealthy',
        responseTime,
        message: 'No data found'
      }
    }

    const lastUpdate = new Date(data[0].updated_at)
    const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceUpdate > 30) {
      return {
        status: 'degraded',
        responseTime,
        message: `Data is ${Math.round(daysSinceUpdate)} days old`
      }
    }

    return {
      status: 'healthy',
      responseTime,
      message: `Data updated ${Math.round(daysSinceUpdate)} days ago`
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Math.round(performance.now() - start),
      error: error instanceof Error ? error.message : 'Data freshness check failed'
    }
  }
}

// Check embeddings quality
async function checkEmbeddingsQuality(): Promise<HealthCheck> {
  const start = performance.now()

  try {
    // Test vector search with a sample query
    const { data, error } = await supabase.rpc('match_muva_documents', {
      query_embedding: new Array(3072).fill(0.1), // Sample embedding
      match_threshold: 0.1,
      match_count: 1
    })

    const responseTime = Math.round(performance.now() - start)

    if (error) {
      return {
        status: 'unhealthy',
        responseTime,
        error: `Vector search failed: ${error.message}`
      }
    }

    return {
      status: 'healthy',
      responseTime,
      message: 'Vector search working correctly'
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Math.round(performance.now() - start),
      error: error instanceof Error ? error.message : 'Embeddings check failed'
    }
  }
}

// Test filter performance
async function checkFilterPerformance(): Promise<HealthCheck> {
  const start = performance.now()

  try {
    const { data, error } = await supabase
      .from('muva_embeddings')
      .select('category, location, count(*)')
      .not('category', 'is', null)
      .limit(10)

    const responseTime = Math.round(performance.now() - start)

    if (error) {
      return {
        status: 'unhealthy',
        responseTime,
        error: error.message
      }
    }

    const hasData = data && data.length > 0
    return {
      status: hasData ? 'healthy' : 'degraded',
      responseTime,
      message: hasData ? 'Filters working correctly' : 'Limited filter data'
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Math.round(performance.now() - start),
      error: error instanceof Error ? error.message : 'Filter test failed'
    }
  }
}

// Get tourism statistics
async function getTourismStats() {
  try {
    // Get total count
    const { count: totalEmbeddings } = await supabase
      .from('muva_embeddings')
      .select('*', { count: 'exact', head: true })

    // Get available categories
    const { data: categories } = await supabase
      .from('muva_embeddings')
      .select('category')
      .not('category', 'is', null)
      .group('category')

    // Get last update
    const { data: lastUpdate } = await supabase
      .from('muva_embeddings')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)

    return {
      totalEmbeddings: totalEmbeddings || 0,
      categoriesAvailable: categories?.map(c => c.category) || [],
      lastDataUpdate: lastUpdate?.[0]?.updated_at || null,
      avgResponseTime: 0 // TODO: Calculate from actual metrics
    }
  } catch (error) {
    return {
      totalEmbeddings: 0,
      categoriesAvailable: [],
      lastDataUpdate: null,
      avgResponseTime: 0
    }
  }
}

// Determine overall status
function determineOverallStatus(checks: MuvaHealthStatus['checks']): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(checks).map(check => check.status)

  if (statuses.every(status => status === 'healthy')) {
    return 'healthy'
  }

  if (statuses.some(status => status === 'unhealthy')) {
    return 'unhealthy'
  }

  return 'degraded'
}

export async function GET(): Promise<NextResponse> {
  try {
    console.log('[MUVA Health] Starting health check...')

    // Run all health checks in parallel
    const [databaseCheck, freshnessCheck, embeddingsCheck, filterCheck, stats] = await Promise.all([
      checkMuvaEmbeddings(),
      checkDataFreshness(),
      checkEmbeddingsQuality(),
      checkFilterPerformance(),
      getTourismStats()
    ])

    const checks = {
      database: databaseCheck,
      dataFreshness: freshnessCheck,
      embeddings: embeddingsCheck,
      filterPerformance: filterCheck
    }

    const healthStatus: MuvaHealthStatus = {
      service: 'MUVA Tourism Assistant',
      status: determineOverallStatus(checks),
      timestamp: new Date().toISOString(),
      checks,
      stats,
      cache: {
        size: 0, // Will be populated from the cache in the chat route
        hitRate: 0, // TODO: Calculate actual hit rate
        lastCleared: new Date().toISOString()
      }
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 :
                      healthStatus.status === 'degraded' ? 206 : 503

    console.log(`[MUVA Health] Health check completed with status: ${healthStatus.status}`)

    return NextResponse.json(healthStatus, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('[MUVA Health] Fatal error in health check:', error)

    return NextResponse.json({
      service: 'MUVA Tourism Assistant',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed'
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
}