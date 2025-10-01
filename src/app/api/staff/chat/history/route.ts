/**
 * Staff Chat History API Endpoint
 *
 * GET /api/staff/chat/history
 * Returns conversation list or specific conversation messages.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyStaffToken } from '@/lib/staff-auth'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')

    // Validate and parse pagination parameters
    const limit = Math.min(
      Math.max(1, parseInt(limitParam || '50', 10)),
      200 // Max 200 items per request
    )
    const offset = Math.max(0, parseInt(offsetParam || '0', 10))

    const supabase = createServerClient()

    // If conversation_id provided, return messages from that conversation
    if (conversationId) {
      console.log('[staff-history-api] Fetching messages for conversation:', conversationId)

      // Verify conversation belongs to this staff member
      const { data: conversation, error: convError } = await supabase
        .from('staff_conversations')
        .select('staff_id')
        .eq('conversation_id', conversationId)
        .single()

      if (convError || !conversation) {
        return NextResponse.json(
          {
            error: 'Conversation not found',
            message: 'The requested conversation does not exist',
          },
          { status: 404 }
        )
      }

      if (conversation.staff_id !== session.staff_id) {
        return NextResponse.json(
          {
            error: 'Access denied',
            message: 'You do not have permission to access this conversation',
          },
          { status: 403 }
        )
      }

      // Get total message count
      const { count: totalMessages } = await supabase
        .from('staff_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)

      // Get messages with pagination
      const { data: messages, error: messagesError } = await supabase
        .from('staff_messages')
        .select('role, content, created_at, metadata')
        .eq('conversation_id', conversationId)
        .order('message_index', { ascending: true })
        .range(offset, offset + limit - 1)

      if (messagesError) {
        throw messagesError
      }

      return NextResponse.json(
        {
          conversation_id: conversationId,
          messages: messages || [],
          pagination: {
            total: totalMessages || 0,
            limit,
            offset,
            has_more: (totalMessages || 0) > offset + limit,
          },
        },
        { status: 200 }
      )
    }

    // Otherwise, return list of all conversations for this staff member
    console.log('[staff-history-api] Fetching conversations for staff:', session.username)

    // Get total conversation count
    const { count: totalConversations } = await supabase
      .from('staff_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('staff_id', session.staff_id)
      .eq('status', 'active')

    // Get conversations with pagination
    const { data: conversations, error: conversationsError } = await supabase
      .from('staff_conversations')
      .select(`
        conversation_id,
        title,
        category,
        created_at,
        last_message_at
      `)
      .eq('staff_id', session.staff_id)
      .eq('status', 'active')
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (conversationsError) {
      throw conversationsError
    }

    // Get message counts for each conversation
    const conversationsWithCounts = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { count } = await supabase
          .from('staff_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.conversation_id)

        return {
          ...conv,
          message_count: count || 0,
        }
      })
    )

    return NextResponse.json(
      {
        conversations: conversationsWithCounts,
        pagination: {
          total: totalConversations || 0,
          limit,
          offset,
          has_more: (totalConversations || 0) > offset + limit,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[staff-history-api] Error fetching history:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch history',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed', message: 'Use GET to fetch history' },
    { status: 405 }
  )
}
