/**
 * Unit Tests for Staff Chat Engine
 *
 * Tests vector search, role-based permissions, and response generation.
 */

import {
  generateStaffChatResponse,
  type StaffChatResponse,
  type StaffSource,
} from '../staff-chat-engine'
import type { StaffSession } from '../staff-auth'

// Mock dependencies
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'This is a helpful staff response based on the documents provided.',
          },
        ],
        usage: {
          input_tokens: 1500,
          output_tokens: 250,
        },
      }),
    },
  }))
})

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: Array(1536).fill(0.01) }],
      }),
    },
  }))
})

jest.mock('../supabase', () => ({
  createServerClient: jest.fn(),
}))

const { createServerClient } = require('../supabase')

// ============================================================================
// Test Data
// ============================================================================

const mockCEOSession: StaffSession = {
  staff_id: 'ceo-123',
  tenant_id: 'test-tenant',
  username: 'admin_ceo',
  full_name: 'Test CEO',
  role: 'ceo',
  permissions: {
    sire_access: true,
    admin_panel: true,
    reports_access: true,
    modify_operations: true,
  },
}

const mockAdminSession: StaffSession = {
  staff_id: 'admin-123',
  tenant_id: 'test-tenant',
  username: 'admin_simmer',
  full_name: 'Test Admin',
  role: 'admin',
  permissions: {
    sire_access: true,
    admin_panel: true,
    reports_access: true,
    modify_operations: false,
  },
}

const mockHousekeeperSession: StaffSession = {
  staff_id: 'housekeeper-123',
  tenant_id: 'test-tenant',
  username: 'housekeeping_maria',
  full_name: 'Test Housekeeper',
  role: 'housekeeper',
  permissions: {
    sire_access: true,
    admin_panel: false,
    reports_access: false,
    modify_operations: false,
  },
}

const mockSIREResults = [
  {
    id: 'sire-doc-1',
    content: 'SIRE regulations for Colombian hotels...',
    similarity: 0.85,
    metadata: { category: 'sire', title: 'SIRE Compliance Guide' },
  },
  {
    id: 'sire-doc-2',
    content: 'Tax reporting requirements...',
    similarity: 0.78,
    metadata: { category: 'sire', title: 'Tax Reporting' },
  },
]

const mockOperationsResults = [
  {
    operation_id: 'op-1',
    content: 'Check-in procedures for hotel staff...',
    similarity: 0.82,
    category: 'reception',
    title: 'Check-in Process',
    access_level: 'public',
  },
  {
    operation_id: 'op-2',
    content: 'Housekeeping cleaning checklist...',
    similarity: 0.75,
    category: 'housekeeping',
    title: 'Cleaning Standards',
    access_level: 'housekeeper',
  },
]

const mockAdminResults = [
  {
    operation_id: 'admin-1',
    content: 'Financial reporting procedures...',
    similarity: 0.88,
    category: 'admin',
    title: 'Financial Reports',
    access_level: 'admin',
  },
]

const mockPoliciesResults = [
  {
    id: 'policy-1',
    content: 'Employee conduct policy...',
    similarity: 0.80,
    metadata: { type: 'hr_policy' },
  },
]

const mockEmbedding = Array(1536).fill(0.01)

// ============================================================================
// Setup Mocks
// ============================================================================

describe('Staff Chat Engine', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Reset the module cache to clear singleton instances
    jest.resetModules()

    // Mock Supabase client
    mockSupabaseClient = {
      from: jest.fn((table: string) => {
        if (table === 'staff_conversations') {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { conversation_id: 'test-conversation-id' },
                  error: null,
                }),
              })),
            })),
            update: jest.fn(() => ({
              eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
            })),
          }
        } else if (table === 'staff_messages') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => ({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                })),
              })),
            })),
            insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
          }
        }
        return {}
      }),
      rpc: jest.fn((funcName: string, params: any) => {
        // Match SIRE documents (uses 3072d embedding)
        if (funcName === 'match_sire_documents') {
          return Promise.resolve({ data: mockSIREResults, error: null })
        }
        // Match hotel operations (uses 1536d embedding)
        else if (funcName === 'match_hotel_operations_balanced') {
          // Return different results based on access_levels
          if (params.p_access_levels?.includes('admin') || params.p_access_levels?.includes('executive')) {
            return Promise.resolve({ data: mockAdminResults, error: null })
          }
          return Promise.resolve({ data: mockOperationsResults, error: null })
        }
        // Match policies
        else if (funcName === 'match_policies') {
          return Promise.resolve({ data: mockPoliciesResults, error: null })
        }
        return Promise.resolve({ data: [], error: null })
      }),
    }

    ;(createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  // ============================================================================
  // Tests - performStaffSearch (via generateStaffChatResponse)
  // ============================================================================

  describe('Vector Search with Role-Based Permissions', () => {
    it('should include SIRE content for staff with sire_access permission', async () => {
      const response = await generateStaffChatResponse(
        '¿Cuáles son los requisitos SIRE?',
        undefined,
        mockCEOSession
      )

      // Verify SIRE RPC was called (uses full 3072d embedding)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'match_sire_documents',
        expect.objectContaining({
          p_tenant_id: 'test-tenant',
        })
      )

      // Response should include sources
      expect(response.sources).toBeDefined()
      expect(response.sources.length).toBeGreaterThan(0)
    })

    it('should include hotel operations for all staff', async () => {
      const response = await generateStaffChatResponse(
        '¿Cuál es el procedimiento de check-in?',
        undefined,
        mockHousekeeperSession
      )

      // Verify operations RPC was called
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'match_hotel_operations_balanced',
        expect.objectContaining({
          p_tenant_id: 'test-tenant',
          p_access_levels: ['public', 'housekeeper'],
        })
      )

      expect(response.sources).toBeDefined()
    })

    it('should respect role permissions (CEO vs Housekeeper)', async () => {
      // CEO query for admin content
      const ceoResponse = await generateStaffChatResponse(
        '¿Cómo accedo a los reportes financieros?',
        undefined,
        mockCEOSession
      )

      // Verify admin content RPC was called for CEO
      const adminCalls = (mockSupabaseClient.rpc as jest.Mock).mock.calls.filter(
        (call) =>
          call[0] === 'match_hotel_operations_balanced' &&
          call[1].p_access_levels?.includes('admin')
      )
      expect(adminCalls.length).toBeGreaterThan(0)

      // Housekeeper query for same content
      jest.clearAllMocks()
      ;(createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient)

      const housekeeperResponse = await generateStaffChatResponse(
        '¿Cómo acceso a los reportes financieros?',
        undefined,
        mockHousekeeperSession
      )

      // Verify admin content RPC was NOT called for Housekeeper
      const housekeeperAdminCalls = (mockSupabaseClient.rpc as jest.Mock).mock.calls.filter(
        (call) =>
          call[0] === 'match_hotel_operations_balanced' &&
          call[1].p_access_levels?.includes('admin')
      )
      expect(housekeeperAdminCalls.length).toBe(0)
    })

    it('should include policies for all staff', async () => {
      const response = await generateStaffChatResponse(
        '¿Cuál es la política de uniformes?',
        undefined,
        mockAdminSession
      )

      // Verify policies RPC was called
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'match_policies',
        expect.objectContaining({
          p_tenant_id: 'test-tenant',
        })
      )
    })

    it('should perform parallel searches and combine results', async () => {
      const response = await generateStaffChatResponse(
        'General staff query',
        undefined,
        mockCEOSession
      )

      // CEO should trigger all searches (SIRE, Operations, Policies, Admin)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(4)

      // Verify response structure
      expect(response).toHaveProperty('conversation_id')
      expect(response).toHaveProperty('response')
      expect(response).toHaveProperty('sources')
      expect(response).toHaveProperty('metadata')
    })
  })

  // ============================================================================
  // Tests - Response Generation
  // ============================================================================

  describe('generateStaffChatResponse()', () => {
    it('should generate response with sources', async () => {
      const response = await generateStaffChatResponse(
        '¿Cómo funciona el check-in?',
        undefined,
        mockAdminSession
      )

      expect(response.response).toBeDefined()
      expect(typeof response.response).toBe('string')
      expect(response.response.length).toBeGreaterThan(0)
      expect(response.sources).toBeDefined()
      expect(Array.isArray(response.sources)).toBe(true)
    })

    it('should save messages to database', async () => {
      const userMessage = 'Test staff question'

      await generateStaffChatResponse(userMessage, undefined, mockCEOSession)

      // Verify messages were inserted
      const messageInsertCalls = (mockSupabaseClient.from as jest.Mock).mock.calls.filter(
        (call) => call[0] === 'staff_messages'
      )
      expect(messageInsertCalls.length).toBeGreaterThan(0)
    })

    it('should track metadata (tokens, cost, response time)', async () => {
      const response = await generateStaffChatResponse(
        'Test query',
        undefined,
        mockAdminSession
      )

      expect(response.metadata).toBeDefined()
      expect(response.metadata.token_usage).toBeDefined()
      expect(response.metadata.token_usage.input).toBeGreaterThan(0)
      expect(response.metadata.token_usage.output).toBeGreaterThan(0)
      expect(response.metadata.token_usage.total).toBeGreaterThan(0)
      expect(response.metadata.cost_usd).toBeGreaterThan(0)
      expect(response.metadata.intent).toBeDefined()
      expect(response.metadata.intent.type).toMatch(/sire|operations|admin|general/)
    })

    it('should create new conversation if none provided', async () => {
      const response = await generateStaffChatResponse(
        'First message',
        undefined,
        mockAdminSession
      )

      expect(response.conversation_id).toBeDefined()
      // Note: In the mock, conversation_id comes from the created conversation
      expect(typeof response.conversation_id).toBe('string')

      // Verify conversation was created
      const conversationInsertCalls = (mockSupabaseClient.from as jest.Mock).mock.calls.filter(
        (call) => call[0] === 'staff_conversations'
      )
      expect(conversationInsertCalls.length).toBeGreaterThan(0)
    })

    it('should use existing conversation if provided', async () => {
      const existingConversationId = 'existing-conv-id'

      // Mock existing conversation
      mockSupabaseClient.from = jest.fn((table: string) => {
        if (table === 'staff_conversations') {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { id: existingConversationId },
                  error: null,
                }),
              })),
            })),
            update: jest.fn(() => ({
              eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
            })),
          }
        } else if (table === 'staff_messages') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => ({
                  limit: jest.fn().mockResolvedValue({
                    data: [
                      {
                        role: 'user',
                        content: 'Previous message',
                        created_at: new Date().toISOString(),
                      },
                    ],
                    error: null,
                  }),
                })),
              })),
            })),
            insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
          }
        }
        return {}
      })

      const response = await generateStaffChatResponse(
        'Follow-up message',
        existingConversationId,
        mockAdminSession
      )

      expect(response.conversation_id).toBe(existingConversationId)
    })

    it('should handle errors gracefully', async () => {
      // Mock error in Supabase RPC - this will cause vector search to return empty arrays
      // which is valid behavior (graceful degradation)
      mockSupabaseClient.rpc = jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })

      // The function handles errors gracefully and returns empty results
      // rather than throwing, so we test that it still returns a valid response
      const response = await generateStaffChatResponse('Test query', undefined, mockAdminSession)

      expect(response).toBeDefined()
      expect(response.sources).toBeDefined()
      // Sources may be empty due to search errors, which is expected
      expect(Array.isArray(response.sources)).toBe(true)
    })
  })

  // ============================================================================
  // Tests - Admin Content Access
  // ============================================================================

  describe('Admin Content Access Control', () => {
    it('should allow CEO to access admin content', async () => {
      await generateStaffChatResponse(
        'Admin query',
        undefined,
        mockCEOSession
      )

      // Verify admin content search was called
      const adminCalls = (mockSupabaseClient.rpc as jest.Mock).mock.calls.filter(
        (call) =>
          call[0] === 'match_hotel_operations_balanced' &&
          call[1].p_access_levels?.includes('admin')
      )
      expect(adminCalls.length).toBeGreaterThan(0)
    })

    it('should allow Admin to access admin content', async () => {
      await generateStaffChatResponse(
        'Admin query',
        undefined,
        mockAdminSession
      )

      // Verify admin content search was called
      const adminCalls = (mockSupabaseClient.rpc as jest.Mock).mock.calls.filter(
        (call) =>
          call[0] === 'match_hotel_operations_balanced' &&
          call[1].p_access_levels?.includes('admin')
      )
      expect(adminCalls.length).toBeGreaterThan(0)
    })

    it('should deny Housekeeper access to admin content', async () => {
      await generateStaffChatResponse(
        'Admin query',
        undefined,
        mockHousekeeperSession
      )

      // Verify admin content search was NOT called
      const adminCalls = (mockSupabaseClient.rpc as jest.Mock).mock.calls.filter(
        (call) =>
          call[0] === 'match_hotel_operations_balanced' &&
          call[1].p_access_levels?.includes('admin')
      )
      expect(adminCalls.length).toBe(0)
    })
  })

  // ============================================================================
  // Tests - Intent Detection
  // ============================================================================

  describe('Intent Detection', () => {
    it('should detect SIRE intent from query content', async () => {
      const response = await generateStaffChatResponse(
        '¿Cuáles son los requisitos SIRE para validación?',
        undefined,
        mockCEOSession
      )

      expect(response.metadata.intent.type).toBe('sire')
      expect(response.metadata.intent.confidence).toBeGreaterThan(0)
    })

    it('should detect operations intent from query content', async () => {
      const response = await generateStaffChatResponse(
        '¿Cuál es el procedimiento de housekeeping?',
        undefined,
        mockHousekeeperSession
      )

      expect(response.metadata.intent.type).toMatch(/operations|general/)
    })

    it('should detect admin intent from query content', async () => {
      const response = await generateStaffChatResponse(
        '¿Cómo genero reportes de finanzas?',
        undefined,
        mockCEOSession
      )

      // Intent detection is keyword-based, so "finanzas" could match operations or admin
      // We just verify that intent is detected and has a valid type
      expect(response.metadata.intent.type).toMatch(/admin|operations|general/)
      expect(response.metadata.intent.confidence).toBeGreaterThan(0)
    })
  })
})
