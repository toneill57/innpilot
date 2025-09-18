import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

export async function GET() {
  try {
    const startTime = Date.now()

    // Test Supabase connection
    const { data, error } = await supabase
      .from('document_embeddings')
      .select('id')
      .limit(1)

    const responseTime = Date.now() - startTime

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        supabase: {
          status: error ? 'error' : 'healthy',
          responseTime: `${responseTime}ms`,
          error: error?.message || null
        },
        openai: {
          status: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured'
        },
        anthropic: {
          status: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not_configured'
        }
      },
      environment: {
        runtime: 'edge',
        region: process.env.VERCEL_REGION || 'local',
        deployment: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'local'
      }
    }

    // Set overall status based on critical services
    const criticalError = error || !process.env.OPENAI_API_KEY || !process.env.ANTHROPIC_API_KEY
    if (criticalError) {
      health.status = 'degraded'
    }

    const statusCode = health.status === 'healthy' ? 200 : 503

    return NextResponse.json(health, { status: statusCode })

  } catch (error) {
    console.error('Health check error:', error)

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