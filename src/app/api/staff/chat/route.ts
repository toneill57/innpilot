/**
 * Staff Chat API Endpoint
 *
 * POST /api/staff/chat
 * Handles staff chat interactions with role-based vector search.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyStaffToken } from '@/lib/staff-auth'
import { generateStaffChatResponse } from '@/lib/staff-chat-engine'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Extract Bearer token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          error: 'Missing authentication',
          message: 'Authorization header with Bearer token is required',
        },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify token
    const session = await verifyStaffToken(token)
    if (!session) {
      return NextResponse.json(
        {
          error: 'Invalid or expired token',
          message: 'Please login again',
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { message, conversation_id } = body

    // Validate message
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'Message is required and must be a string',
        },
        { status: 400 }
      )
    }

    // Validate message length
    if (message.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'Message cannot be empty',
        },
        { status: 400 }
      )
    }

    if (message.length > 2000) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'Message is too long (max 2000 characters)',
        },
        { status: 400 }
      )
    }

    // Validate conversation_id if provided
    if (conversation_id !== undefined && typeof conversation_id !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'conversation_id must be a string',
        },
        { status: 400 }
      )
    }

    console.log('[staff-chat-api] Chat request:', {
      timestamp: new Date().toISOString(),
      username: session.username,
      role: session.role,
      tenant: session.tenant_id,
      permissions: session.permissions,
      message_preview: message.substring(0, 50) + '...',
      conversation_id: conversation_id || 'new',
    })

    // Generate response
    const response = await generateStaffChatResponse(
      message,
      conversation_id,
      session
    )

    const responseTime = Date.now() - startTime

    console.log('[staff-chat-api] Response generated:', {
      conversation_id: response.conversation_id,
      sources_count: response.sources.length,
      intent: response.metadata.intent.type,
      tokens: response.metadata.token_usage.total,
      response_time_ms: responseTime,
    })

    // Return response
    return NextResponse.json(
      {
        conversation_id: response.conversation_id,
        response: response.response,
        sources: response.sources,
        metadata: {
          ...response.metadata,
          response_time_ms: responseTime,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    const responseTime = Date.now() - startTime

    console.error('[staff-chat-api] Chat error:', {
      error: error.message,
      stack: error.stack,
      response_time_ms: responseTime,
    })

    return NextResponse.json(
      {
        error: 'Failed to generate response',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed', message: 'Use POST to send messages' },
    { status: 405 }
  )
}
