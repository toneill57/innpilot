/**
 * Integration tests for /api/guest/chat endpoint
 * Tests full conversational flow with context preservation
 *
 * Coverage: >70% target for integration testing
 */

// Mock Next.js server before importing route
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: (body: any, init?: any) => ({
      json: async () => body,
      status: init?.status || 200,
      headers: new Map(Object.entries(init?.headers || {})),
    }),
  },
}))

// Mock dependencies
jest.mock('@/lib/guest-auth')
jest.mock('@/lib/supabase')
jest.mock('@/lib/conversational-chat-engine')

import { POST, GET } from '../route'
import { verifyGuestToken, extractTokenFromHeader, GuestAuthErrors } from '@/lib/guest-auth'
import { createServerClient } from '@/lib/supabase'
import { generateConversationalResponse } from '@/lib/conversational-chat-engine'

describe('POST /api/guest/chat - Integration Tests', () => {
  let mockSupabase: any
  const validToken = 'valid-jwt-token'
  const conversationId = 'test-conversation-123'
  const tenantId = 'test-tenant'
  const mockSession = {
    guest_id: 'guest-123',
    guest_name: 'John Doe',
    guest_email: 'john@example.com',
    guest_phone: '+1234567890',
    reservation_code: 'RES-001',
    check_in: '2025-10-01',
    check_out: '2025-10-05',
    conversation_id: conversationId,
    tenant_id: tenantId,
  }

  // Helper to create Supabase mock with history data
  const setupSupabaseMock = (historyData: any[] = [], insertError: any = null) => {
    const mockChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: historyData, error: null }),
    }

    mockSupabase = {
      from: jest.fn().mockImplementation(() => ({
        insert: jest.fn().mockResolvedValue({ error: insertError }),
        select: jest.fn().mockReturnValue(mockChain),
      })),
    }
    ;(createServerClient as jest.Mock).mockReturnValue(mockSupabase)
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock authentication functions
    ;(extractTokenFromHeader as jest.Mock).mockImplementation((header: string | null) => {
      if (!header) return null
      return header.replace('Bearer ', '')
    })

    ;(verifyGuestToken as jest.Mock).mockImplementation((token: string) => {
      if (token === validToken) return Promise.resolve(mockSession)
      return Promise.resolve(null)
    })

    // Setup default Supabase mock (empty history)
    setupSupabaseMock()

    // Default conversational response
    ;(generateConversationalResponse as jest.Mock).mockResolvedValue({
      response: 'Test response',
      entities: [],
      followUpSuggestions: [],
      sources: [],
      confidence: 0.9,
    })
  })

  // Helper to create mock request
  const createMockRequest = (message: string | undefined, authorization?: string) => ({
    headers: {
      get: (key: string) => (key === 'Authorization' ? authorization || null : null),
    },
    json: async () => (message !== undefined ? { message } : {}),
  })

  describe('Authentication Flow', () => {
    it('should reject request without Authorization header', async () => {
      const request = createMockRequest('Hello')
      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe(GuestAuthErrors.MISSING_HEADER)
      expect(extractTokenFromHeader).toHaveBeenCalledWith(null)
    })

    it('should reject request with invalid token', async () => {
      const request = createMockRequest('Hello', 'Bearer invalid-token')
      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe(GuestAuthErrors.INVALID_TOKEN)
      expect(verifyGuestToken).toHaveBeenCalledWith('invalid-token')
    })

    it('should accept valid token and authenticate guest', async () => {
      const request = createMockRequest('Hello', `Bearer ${validToken}`)
      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(verifyGuestToken).toHaveBeenCalledWith(validToken)
    })
  })

  describe('Request Validation', () => {
    it('should reject request with missing message', async () => {
      const request = createMockRequest(undefined, `Bearer ${validToken}`)
      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Message is required')
    })

    it('should reject request with empty message', async () => {
      const request = createMockRequest('   ', `Bearer ${validToken}`)
      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
    })

    it('should reject message exceeding 1000 characters', async () => {
      const longMessage = 'a'.repeat(1001)
      const request = createMockRequest(longMessage, `Bearer ${validToken}`)
      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Message too long')
    })

    it('should accept valid message within character limit', async () => {
      const validMessage = 'Tell me about surfing'
      const request = createMockRequest(validMessage, `Bearer ${validToken}`)
      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Full Conversational Flow', () => {
    it('should handle first message in conversation (no history)', async () => {
      setupSupabaseMock([]) // Empty history
      ;(generateConversationalResponse as jest.Mock).mockResolvedValue({
        response: 'Welcome! How can I help you today?',
        entities: [],
        followUpSuggestions: ['Tell me about activities', 'Show me restaurants', 'Book a tour'],
        sources: [],
        confidence: 0.95,
      })

      const request = createMockRequest('Hello!', `Bearer ${validToken}`)
      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.response).toBe('Welcome! How can I help you today?')
      expect(data.followUpSuggestions).toHaveLength(3)
      expect(data.metadata.guestName).toBe('John Doe')
      expect(data.metadata.conversationId).toBe(conversationId)

      // Should call from('chat_messages') for insert operations
      expect(mockSupabase.from).toHaveBeenCalledWith('chat_messages')

      // Should pass empty history to engine
      expect(generateConversationalResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'Hello!',
          history: [],
          guestInfo: mockSession,
        })
      )
    })

    it('should handle follow-up message with context preservation', async () => {
      const previousMessages = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'What activities are available?',
          entities: [],
          created_at: '2025-09-30T10:00:00Z',
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'We have surfing, scuba diving, and snorkeling available.',
          entities: ['surfing', 'scuba diving', 'snorkeling'],
          created_at: '2025-09-30T10:00:05Z',
        },
      ]

      setupSupabaseMock(previousMessages)
      ;(generateConversationalResponse as jest.Mock).mockResolvedValue({
        response: 'Great choice! Surfing lessons are available daily from 9 AM to 4 PM.',
        entities: ['surfing'],
        followUpSuggestions: ['How much does it cost?', 'Can I book for tomorrow?', 'Do you provide equipment?'],
        sources: [{ title: 'Surf School', url: '/activities/surfing' }],
        confidence: 0.92,
      })

      const request = createMockRequest('Tell me more about surfing', `Bearer ${validToken}`)
      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.response).toContain('Surfing')
      expect(data.entities).toContain('surfing')
      expect(data.followUpSuggestions).toHaveLength(3)

      // Verify context was passed to engine
      expect(generateConversationalResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'Tell me more about surfing',
          history: expect.arrayContaining([
            expect.objectContaining({ role: 'user', content: 'What activities are available?' }),
            expect.objectContaining({ role: 'assistant', entities: expect.arrayContaining(['surfing']) }),
          ]),
          guestInfo: mockSession,
        })
      )
    })

    it('should track entities across multiple messages', async () => {
      const previousMessages = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'I want to try surfing',
          entities: null, // entities can be null in database
          created_at: '2025-09-30T10:00:00Z',
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Surfing lessons available at Rocky Cay beach.',
          entities: ['surfing', 'Rocky Cay'], // entities stored as jsonb array
          created_at: '2025-09-30T10:00:05Z',
        },
      ]

      setupSupabaseMock(previousMessages)
      ;(generateConversationalResponse as jest.Mock).mockResolvedValue({
        response: 'Rocky Cay is located in the north of the island.',
        entities: ['Rocky Cay', 'downtown'],
        followUpSuggestions: ['How do I get there?', 'What else is nearby?'],
        sources: [],
        confidence: 0.88,
      })

      const request = createMockRequest('Where is that beach?', `Bearer ${validToken}`)
      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.entities).toEqual(expect.arrayContaining(['Rocky Cay']))

      // Verify entity tracking through history
      const callArgs = (generateConversationalResponse as jest.Mock).mock.calls[0][0]
      expect(callArgs.history).toHaveLength(2)
      // Check that entities are properly handled (null converted to empty array by route)
      expect(Array.isArray(callArgs.history[0].entities)).toBe(true)
      expect(Array.isArray(callArgs.history[1].entities)).toBe(true)
      // History should contain both messages with proper entity extraction (newest first)
      expect(callArgs.history[0].content).toBe('Surfing lessons available at Rocky Cay beach.')
      expect(callArgs.history[1].content).toBe('I want to try surfing')
    })
  })

  describe('Error Handling', () => {
    it('should continue if saving user message fails', async () => {
      setupSupabaseMock([], new Error('Database error'))

      const request = createMockRequest('Hello', `Bearer ${validToken}`)
      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle conversation history load failure gracefully', async () => {
      // Mock history load failure
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: null, error: new Error('Load failed') }),
      }
      mockSupabase = {
        from: jest.fn().mockImplementation(() => ({
          insert: jest.fn().mockResolvedValue({ error: null }),
          select: jest.fn().mockReturnValue(mockChain),
        })),
      }
      ;(createServerClient as jest.Mock).mockReturnValue(mockSupabase)

      const request = createMockRequest('Hello', `Bearer ${validToken}`)
      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Should pass empty history to engine
      expect(generateConversationalResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          history: [],
        })
      )
    })

    it('should handle conversational engine errors', async () => {
      ;(generateConversationalResponse as jest.Mock).mockRejectedValue(new Error('Engine failure'))

      const request = createMockRequest('Hello', `Bearer ${validToken}`)
      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(data.details).toBe('Engine failure')
    })
  })

  describe('Response Structure', () => {
    it('should return all required fields in success response', async () => {
      ;(generateConversationalResponse as jest.Mock).mockResolvedValue({
        response: 'Test response',
        entities: ['entity1', 'entity2'],
        followUpSuggestions: ['suggestion1', 'suggestion2'],
        sources: [{ title: 'Source 1', url: '/source1' }],
        confidence: 0.85,
      })

      const request = createMockRequest('Hello', `Bearer ${validToken}`)
      const response = await POST(request as any)
      const data = await response.json()

      expect(data).toEqual({
        success: true,
        response: 'Test response',
        entities: ['entity1', 'entity2'],
        followUpSuggestions: ['suggestion1', 'suggestion2'],
        sources: [{ title: 'Source 1', url: '/source1' }],
        metadata: {
          confidence: 0.85,
          responseTime: expect.any(Number),
          guestName: 'John Doe',
          conversationId: conversationId,
        },
      })
    })

    it('should include response time in metadata', async () => {
      const request = createMockRequest('Hello', `Bearer ${validToken}`)
      const response = await POST(request as any)
      const data = await response.json()

      expect(data.metadata.responseTime).toBeGreaterThanOrEqual(0)
      expect(typeof data.metadata.responseTime).toBe('number')
    })
  })
})

describe('GET /api/guest/chat - API Info', () => {
  it('should return API information', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.endpoint).toBe('/api/guest/chat')
    expect(data.method).toBe('POST')
    expect(data.authentication).toContain('JWT')
    expect(data.features).toContain('Context-aware responses')
    expect(data.features).toContain('Entity tracking')
    expect(data.features).toContain('Follow-up suggestions')
    expect(data.features).toContain('Full conversation history')
  })
})
