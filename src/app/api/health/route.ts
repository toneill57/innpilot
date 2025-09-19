import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

export async function GET() {
  try {
    console.log('[Health] Starting health check...')
    const startTime = Date.now()

    // Initialize health object
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        openai: {
          status: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured'
        },
        anthropic: {
          status: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not_configured'
        },
        supabase: {
          status: 'testing' as 'testing' | 'healthy' | 'error',
          responseTime: '0ms',
          error: null as string | null
        }
      },
      environment: {
        runtime: 'edge',
        region: process.env.VERCEL_REGION || 'local',
        deployment: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'local'
      }
    }

    // Test Supabase connection with better error handling
    try {
      console.log('[Health] Testing Supabase connection...')
      const { error: supabaseError } = await supabase
        .from('document_embeddings')
        .select('id')
        .limit(1)

      const responseTime = Date.now() - startTime
      console.log(`[Health] Supabase test completed in ${responseTime}ms`)

      health.services.supabase = {
        status: supabaseError ? 'error' : 'healthy',
        responseTime: `${responseTime}ms`,
        error: supabaseError?.message || null
      }

      // Set overall status based on critical services
      const criticalError = supabaseError || !process.env.OPENAI_API_KEY || !process.env.ANTHROPIC_API_KEY
      if (criticalError) {
        health.status = 'degraded'
      }

    } catch (supabaseError) {
      console.error('[Health] Supabase connection failed:', supabaseError)
      health.services.supabase = {
        status: 'error',
        responseTime: `${Date.now() - startTime}ms`,
        error: supabaseError instanceof Error ? supabaseError.message : 'Connection failed'
      }
      health.status = 'degraded'
    }

    const statusCode = health.status === 'healthy' ? 200 : 503
    console.log(`[Health] Health check completed with status: ${health.status}`)

    return NextResponse.json(health, { status: statusCode })

  } catch (error) {
    console.error('[Health] Fatal error in health check:', error)

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}