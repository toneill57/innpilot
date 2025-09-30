/**
 * Unit Tests for Guest Authentication System
 *
 * Tests authentication, JWT generation/verification, and edge cases.
 */

import {
  authenticateGuest,
  generateGuestToken,
  verifyGuestToken,
  isTokenExpired,
  extractTokenFromHeader,
  GuestAuthErrors,
  type GuestSession,
  type GuestCredentials,
} from '../guest-auth'

// Mock jose library
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mocked.jwt.token'),
  })),
  jwtVerify: jest.fn().mockImplementation(async (token: string) => {
    if (token === 'mocked.jwt.token' || token.startsWith('valid-')) {
      return {
        payload: {
          reservation_id: 'test-reservation-id',
          conversation_id: 'test-conversation-id',
          tenant_id: 'test-tenant',
          guest_name: 'John Doe',
          type: 'guest',
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        },
      }
    }
    throw new Error('Invalid token')
  }),
}))

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  createServerClient: jest.fn(),
}))

const { createServerClient } = require('@/lib/supabase')

// ============================================================================
// Test Data
// ============================================================================

const mockReservation = {
  id: 'test-reservation-id',
  tenant_id: 'test-tenant',
  guest_name: 'John Doe',
  phone_last_4: '1234',
  check_in_date: '2025-10-01',
  check_out_date: '2025-10-05',
  reservation_code: 'RSV001',
  status: 'active',
}

const mockConversation = {
  id: 'test-conversation-id',
  user_id: 'test-reservation-id',
  user_type: 'guest',
  reservation_id: 'test-reservation-id',
  tenant_id: 'test-tenant',
  status: 'active',
}

const validCredentials: GuestCredentials = {
  tenant_id: 'test-tenant',
  check_in_date: '2025-10-01',
  phone_last_4: '1234',
}

// ============================================================================
// authenticateGuest() Tests
// ============================================================================

describe('authenticateGuest()', () => {
  let mockSupabase: any

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Create a chainable mock that returns itself for all query builder methods
    const chainableMock = {
      from: jest.fn(),
      select: jest.fn(),
      eq: jest.fn(),
      maybeSingle: jest.fn(),
      insert: jest.fn(),
      single: jest.fn(),
    }

    // Make all methods return the mock itself for chaining
    Object.keys(chainableMock).forEach((key) => {
      if (key !== 'maybeSingle' && key !== 'single') {
        chainableMock[key].mockReturnValue(chainableMock)
      }
    })

    mockSupabase = chainableMock
    createServerClient.mockReturnValue(mockSupabase)
  })

  test('should authenticate valid guest credentials', async () => {
    // First call: get reservations (returns after multiple .eq() calls)
    let eqCallCount = 0
    mockSupabase.eq.mockImplementation(() => {
      eqCallCount++
      if (eqCallCount === 4) { // After 4th eq() (tenant, check_in, phone, status)
        return Promise.resolve({
          data: [mockReservation],
          error: null,
        })
      }
      return mockSupabase // Continue chaining
    })

    // Second call: check existing conversation (also uses .eq() chain)
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: mockConversation,
      error: null,
    })

    const session = await authenticateGuest(validCredentials)

    expect(session).not.toBeNull()
    expect(session?.reservation_id).toBe('test-reservation-id')
    expect(session?.conversation_id).toBe('test-conversation-id')
    expect(session?.guest_name).toBe('John Doe')
  })

  test('should return null for invalid credentials', async () => {
    mockSupabase.eq.mockResolvedValueOnce({
      data: [],
      error: null,
    })

    const session = await authenticateGuest(validCredentials)

    expect(session).toBeNull()
  })

  test('should reject invalid phone_last_4 format', async () => {
    const invalidCredentials = {
      ...validCredentials,
      phone_last_4: '123', // Only 3 digits
    }

    const session = await authenticateGuest(invalidCredentials)

    expect(session).toBeNull()
  })

  test('should reject non-numeric phone_last_4', async () => {
    const invalidCredentials = {
      ...validCredentials,
      phone_last_4: 'abcd',
    }

    const session = await authenticateGuest(invalidCredentials)

    expect(session).toBeNull()
  })

  test('should handle missing required fields', async () => {
    const incompleteCredentials = {
      tenant_id: 'test-tenant',
      check_in_date: '',
      phone_last_4: '1234',
    }

    const session = await authenticateGuest(incompleteCredentials as GuestCredentials)

    expect(session).toBeNull()
  })

  test('should create new conversation if none exists', async () => {
    // Mock reservation query (4 .eq() calls)
    let eqCallCount = 0
    mockSupabase.eq.mockImplementation(() => {
      eqCallCount++
      if (eqCallCount === 4) {
        return Promise.resolve({
          data: [mockReservation],
          error: null,
        })
      }
      return mockSupabase
    })

    // Mock conversation check: not found
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' },
    })

    // Mock conversation creation
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'new-conversation-id' },
      error: null,
    })

    const session = await authenticateGuest(validCredentials)

    expect(session).not.toBeNull()
    expect(session?.conversation_id).toBe('new-conversation-id')
    expect(mockSupabase.insert).toHaveBeenCalled()
  })

  test('should handle database errors gracefully', async () => {
    mockSupabase.eq.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database connection error' },
    })

    const session = await authenticateGuest(validCredentials)

    expect(session).toBeNull()
  })
})

// ============================================================================
// generateGuestToken() Tests
// ============================================================================

describe('generateGuestToken()', () => {
  const mockSession: GuestSession = {
    reservation_id: 'test-reservation-id',
    conversation_id: 'test-conversation-id',
    tenant_id: 'test-tenant',
    guest_name: 'John Doe',
    check_in: new Date('2025-10-01'),
    check_out: new Date('2025-10-05'),
    reservation_code: 'RSV001',
  }

  test('should generate a valid JWT token', async () => {
    const token = await generateGuestToken(mockSession)

    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3) // JWT format: header.payload.signature
  })

  test('should include correct payload in token', async () => {
    const token = await generateGuestToken(mockSession)

    // Verify token can be decoded
    const decoded = await verifyGuestToken(token)

    expect(decoded).not.toBeNull()
    expect(decoded?.reservation_id).toBe('test-reservation-id')
    expect(decoded?.conversation_id).toBe('test-conversation-id')
    expect(decoded?.tenant_id).toBe('test-tenant')
  })
})

// ============================================================================
// verifyGuestToken() Tests
// ============================================================================

describe('verifyGuestToken()', () => {
  const mockSession: GuestSession = {
    reservation_id: 'test-reservation-id',
    conversation_id: 'test-conversation-id',
    tenant_id: 'test-tenant',
    guest_name: 'John Doe',
    check_in: new Date('2025-10-01'),
    check_out: new Date('2025-10-05'),
    reservation_code: 'RSV001',
  }

  test('should verify valid token', async () => {
    const token = await generateGuestToken(mockSession)
    const decoded = await verifyGuestToken(token)

    expect(decoded).not.toBeNull()
    expect(decoded?.reservation_id).toBe('test-reservation-id')
  })

  test('should reject invalid token', async () => {
    const invalidToken = 'invalid.token.here'
    const decoded = await verifyGuestToken(invalidToken)

    expect(decoded).toBeNull()
  })

  test('should reject malformed token', async () => {
    const malformedToken = 'not-a-jwt-token'
    const decoded = await verifyGuestToken(malformedToken)

    expect(decoded).toBeNull()
  })

  test('should reject empty token', async () => {
    const decoded = await verifyGuestToken('')

    expect(decoded).toBeNull()
  })
})

// ============================================================================
// isTokenExpired() Tests
// ============================================================================

describe('isTokenExpired()', () => {
  test('should return false for active reservation', () => {
    const activeSession: GuestSession = {
      reservation_id: 'test-id',
      conversation_id: 'conv-id',
      tenant_id: 'tenant',
      guest_name: 'John Doe',
      check_in: new Date('2025-10-01'),
      check_out: new Date('2025-10-05'),
      reservation_code: 'RSV001',
    }

    const expired = isTokenExpired(activeSession)

    expect(expired).toBe(false)
  })

  test('should return false for recently checked out reservation (within 7 days)', () => {
    const today = new Date()
    const checkOut = new Date(today)
    checkOut.setDate(today.getDate() - 3) // 3 days ago

    const recentSession: GuestSession = {
      reservation_id: 'test-id',
      conversation_id: 'conv-id',
      tenant_id: 'tenant',
      guest_name: 'John Doe',
      check_in: new Date('2025-09-01'),
      check_out: checkOut,
      reservation_code: 'RSV001',
    }

    const expired = isTokenExpired(recentSession)

    expect(expired).toBe(false)
  })

  test('should return true for old reservation (>7 days past check-out)', () => {
    const today = new Date()
    const checkOut = new Date(today)
    checkOut.setDate(today.getDate() - 10) // 10 days ago

    const oldSession: GuestSession = {
      reservation_id: 'test-id',
      conversation_id: 'conv-id',
      tenant_id: 'tenant',
      guest_name: 'John Doe',
      check_in: new Date('2025-08-01'),
      check_out: checkOut,
      reservation_code: 'RSV001',
    }

    const expired = isTokenExpired(oldSession)

    expect(expired).toBe(true)
  })
})

// ============================================================================
// extractTokenFromHeader() Tests
// ============================================================================

describe('extractTokenFromHeader()', () => {
  test('should extract token from valid Bearer header', () => {
    const header = 'Bearer abc123.def456.ghi789'
    const token = extractTokenFromHeader(header)

    expect(token).toBe('abc123.def456.ghi789')
  })

  test('should return null for missing header', () => {
    const token = extractTokenFromHeader(null)

    expect(token).toBeNull()
  })

  test('should return null for malformed header (no Bearer)', () => {
    const header = 'abc123.def456.ghi789'
    const token = extractTokenFromHeader(header)

    expect(token).toBeNull()
  })

  test('should return null for malformed header (wrong format)', () => {
    const header = 'Bearer'
    const token = extractTokenFromHeader(header)

    expect(token).toBeNull()
  })

  test('should return null for empty string', () => {
    const token = extractTokenFromHeader('')

    expect(token).toBeNull()
  })
})

// ============================================================================
// GuestAuthErrors Constants Tests
// ============================================================================

describe('GuestAuthErrors', () => {
  test('should have all required error messages', () => {
    expect(GuestAuthErrors.INVALID_CREDENTIALS).toBeDefined()
    expect(GuestAuthErrors.NO_RESERVATION).toBeDefined()
    expect(GuestAuthErrors.INVALID_TOKEN).toBeDefined()
    expect(GuestAuthErrors.EXPIRED_SESSION).toBeDefined()
    expect(GuestAuthErrors.MISSING_HEADER).toBeDefined()
  })

  test('should have non-empty error messages', () => {
    Object.values(GuestAuthErrors).forEach((error) => {
      expect(error).toBeTruthy()
      expect(error.length).toBeGreaterThan(0)
    })
  })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration: Full Authentication Flow', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()

    const chainableMock = {
      from: jest.fn(),
      select: jest.fn(),
      eq: jest.fn(),
      maybeSingle: jest.fn(),
      insert: jest.fn(),
      single: jest.fn(),
    }

    Object.keys(chainableMock).forEach((key) => {
      if (key !== 'maybeSingle' && key !== 'single') {
        chainableMock[key].mockReturnValue(chainableMock)
      }
    })

    mockSupabase = chainableMock
    createServerClient.mockReturnValue(mockSupabase)
  })

  test('should complete full flow: authenticate → generate token → verify token', async () => {
    // Mock reservation query
    let eqCallCount = 0
    mockSupabase.eq.mockImplementation(() => {
      eqCallCount++
      if (eqCallCount === 4) {
        return Promise.resolve({
          data: [mockReservation],
          error: null,
        })
      }
      return mockSupabase
    })

    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: mockConversation,
      error: null,
    })

    // Step 1: Authenticate
    const session = await authenticateGuest(validCredentials)
    expect(session).not.toBeNull()

    // Step 2: Generate token
    const token = await generateGuestToken(session!)
    expect(token).toBeDefined()

    // Step 3: Verify token
    const decoded = await verifyGuestToken(token)
    expect(decoded).not.toBeNull()
    expect(decoded?.reservation_id).toBe(session!.reservation_id)
  })
})
