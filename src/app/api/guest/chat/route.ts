import { NextRequest, NextResponse } from 'next/server'
import { verifyGuestToken, extractTokenFromHeader, GuestAuthErrors } from '@/lib/guest-auth'
import {
  generateConversationalResponse,
  type ConversationalContext,
  type ChatMessage
} from '@/lib/conversational-chat-engine'
import { createServerClient } from '@/lib/supabase'

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_REQUESTS: 20, // Maximum requests
  WINDOW_MS: 60 * 1000, // Per minute
}

// In-memory rate limiter (simple implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

/**
 * Simple rate limiter
 */
function checkRateLimit(conversationId: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(conversationId)

  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitMap.set(conversationId, {
      count: 1,
      resetTime: now + RATE_LIMIT.WINDOW_MS,
    })
    return true
  }

  if (record.count >= RATE_LIMIT.MAX_REQUESTS) {
    return false
  }

  record.count++
  return true
}

/**
 * POST /api/guest/chat
 *
 * Main endpoint for guest conversational chat
 * Requires JWT authentication
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // === AUTHENTICATION ===
    const authHeader = request.headers.get('Authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      console.error('[Guest Chat] Missing authorization header')
      return NextResponse.json(
        { error: GuestAuthErrors.MISSING_HEADER },
        { status: 401 }
      )
    }

    const session = await verifyGuestToken(token)

    if (!session) {
      console.error('[Guest Chat] Invalid or expired token')
      return NextResponse.json(
        { error: GuestAuthErrors.INVALID_TOKEN },
        { status: 401 }
      )
    }

    console.log(`[Guest Chat] Authenticated guest: ${session.guest_name} (conversation: ${session.conversation_id})`)

    // === RATE LIMITING ===
    if (!checkRateLimit(session.conversation_id)) {
      console.warn(`[Guest Chat] Rate limit exceeded for conversation ${session.conversation_id}`)
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please wait a moment before trying again.',
        },
        { status: 429 }
      )
    }

    // === PARSE REQUEST ===
    const { message } = await request.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Validate message length
    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Message too long (maximum 1000 characters)' },
        { status: 400 }
      )
    }

    console.log(`[Guest Chat] Query: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`)

    // === PERSIST USER MESSAGE ===
    const supabase = createServerClient()
    const { error: saveError } = await supabase.from('chat_messages').insert({
      conversation_id: session.conversation_id,
      role: 'user',
      content: message,
      tenant_id: session.tenant_id,
    })

    if (saveError) {
      console.error('[Guest Chat] Failed to save user message:', saveError)
      // Continue anyway - better to respond than fail completely
    }

    // === LOAD CONVERSATION HISTORY ===
    const { data: historyData, error: historyError } = await supabase
      .from('chat_messages')
      .select('id, role, content, entities, created_at')
      .eq('conversation_id', session.conversation_id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (historyError) {
      console.error('[Guest Chat] Failed to load conversation history:', historyError)
    }

    const history: ChatMessage[] = historyData
      ? historyData.reverse().map((msg) => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          entities: msg.entities || [],
          created_at: msg.created_at,
        }))
      : []

    console.log(`[Guest Chat] Loaded ${history.length} previous messages`)

    // === GENERATE CONVERSATIONAL RESPONSE ===
    const context: ConversationalContext = {
      query: message,
      history,
      guestInfo: session,
      vectorResults: [], // Will be populated by the engine
    }

    const conversationalResponse = await generateConversationalResponse(context)

    console.log(`[Guest Chat] Response generated (${conversationalResponse.response.length} chars, confidence: ${conversationalResponse.confidence.toFixed(2)})`)

    // === PERSIST ASSISTANT MESSAGE ===
    const { error: saveResponseError } = await supabase.from('chat_messages').insert({
      conversation_id: session.conversation_id,
      role: 'assistant',
      content: conversationalResponse.response,
      entities: conversationalResponse.entities,
      sources: conversationalResponse.sources,
      metadata: {
        confidence: conversationalResponse.confidence,
        followUpSuggestions: conversationalResponse.followUpSuggestions,
      },
      tenant_id: session.tenant_id,
    })

    if (saveResponseError) {
      console.error('[Guest Chat] Failed to save assistant message:', saveResponseError)
      // Continue anyway
    }

    const totalTime = Date.now() - startTime

    console.log(`[Guest Chat] ✅ Request completed in ${totalTime}ms`)

    // === RETURN RESPONSE ===
    return NextResponse.json({
      success: true,
      response: conversationalResponse.response,
      entities: conversationalResponse.entities,
      followUpSuggestions: conversationalResponse.followUpSuggestions,
      sources: conversationalResponse.sources,
      metadata: {
        confidence: conversationalResponse.confidence,
        responseTime: totalTime,
        guestName: session.guest_name,
        conversationId: session.conversation_id,
      },
    })
  } catch (error) {
    console.error('[Guest Chat] Unexpected error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/guest/chat
 *
 * API information endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/guest/chat',
    description: 'Conversational chat endpoint for authenticated guests',
    method: 'POST',
    authentication: 'JWT token via Authorization header',
    rateLimit: `${RATE_LIMIT.MAX_REQUESTS} requests per ${RATE_LIMIT.WINDOW_MS / 1000} seconds`,
    request: {
      headers: {
        Authorization: 'Bearer <jwt_token>',
        'Content-Type': 'application/json',
      },
      body: {
        message: 'string (required, max 1000 chars)',
      },
    },
    response: {
      success: 'boolean',
      response: 'string (conversational response)',
      entities: 'string[] (extracted entities)',
      followUpSuggestions: 'string[] (suggested next questions)',
      sources: 'SourceMetadata[] (information sources)',
      metadata: {
        confidence: 'number (0-1)',
        responseTime: 'number (milliseconds)',
        guestName: 'string',
        conversationId: 'string',
      },
    },
    features: [
      'JWT authentication',
      'Rate limiting',
      'Context-aware responses',
      'Entity tracking',
      'Follow-up suggestions',
      'Full conversation history',
      'Persistent chat storage',
    ],
  })
}
