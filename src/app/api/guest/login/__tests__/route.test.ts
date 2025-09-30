/**
 * Integration tests for Guest Login API Endpoint
 *
 * Tests the POST /api/guest/login endpoint including validation, authentication,
 * and error handling scenarios.
 */

import { NextRequest } from 'next/server'

// Mock Next.js server before importing route
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: (body: any, init?: any) => {
      const headers = new Map()
      if (init?.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          headers.set(key.toLowerCase(), value)
        })
      }
      return {
        json: async () => body,
        status: init?.status || 200,
        headers,
      }
    },
  },
}))

// Mock dependencies
jest.mock('@/lib/guest-auth', () => ({
  authenticateGuest: jest.fn(),
  generateGuestToken: jest.fn(),
  GuestAuthErrors: {
    NO_RESERVATION: 'No active reservation found',
  },
}))

import { authenticateGuest, generateGuestToken } from '@/lib/guest-auth'
import { POST, OPTIONS } from '../route'

// ============================================================================
// Test Data
// ============================================================================

const mockSession = {
  reservation_id: 'res-123',
  conversation_id: 'conv-456',
  tenant_id: 'simmerdown',
  guest_name: 'John Doe',
  check_in: new Date('2025-10-01'),
  check_out: new Date('2025-10-05'),
  reservation_code: 'RES-001',
}

const validRequestBody = {
  tenant_id: 'simmerdown',
  check_in_date: '2025-10-01',
  phone_last_4: '1234',
}

// Helper to create mock NextRequest
function createMockRequest(body: any): NextRequest {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as NextRequest
}

// ============================================================================
// Tests: POST Handler - Success Cases
// ============================================================================

describe('POST /api/guest/login - Success Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(authenticateGuest as jest.Mock).mockResolvedValue(mockSession)
    ;(generateGuestToken as jest.Mock).mockResolvedValue('mock-jwt-token-abc123')
  })

  it('should return 200 with token on successful authentication', async () => {
    const request = createMockRequest(validRequestBody)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.token).toBe('mock-jwt-token-abc123')
    expect(data.conversation_id).toBe('conv-456')
  })

  it('should return correct guest info structure', async () => {
    const request = createMockRequest(validRequestBody)

    const response = await POST(request)
    const data = await response.json()

    expect(data.guest_info).toEqual({
      name: 'John Doe',
      check_in: '2025-10-01',
      check_out: '2025-10-05',
      reservation_code: 'RES-001',
    })
  })

  it('should call authenticateGuest with correct credentials', async () => {
    const request = createMockRequest(validRequestBody)

    await POST(request)

    expect(authenticateGuest).toHaveBeenCalledWith({
      tenant_id: 'simmerdown',
      check_in_date: '2025-10-01',
      phone_last_4: '1234',
    })
  })

  it('should call generateGuestToken with session', async () => {
    const request = createMockRequest(validRequestBody)

    await POST(request)

    expect(generateGuestToken).toHaveBeenCalledWith(mockSession)
  })
})

// ============================================================================
// Tests: POST Handler - Validation Errors
// ============================================================================

describe('POST /api/guest/login - Validation Errors', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 for missing tenant_id', async () => {
    const invalidBody = {
      check_in_date: '2025-10-01',
      phone_last_4: '1234',
    }
    const request = createMockRequest(invalidBody)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Missing required fields')
    expect(data.code).toBe('MISSING_FIELDS')
  })

  it('should return 400 for missing check_in_date', async () => {
    const invalidBody = {
      tenant_id: 'simmerdown',
      phone_last_4: '1234',
    }
    const request = createMockRequest(invalidBody)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.code).toBe('MISSING_FIELDS')
  })

  it('should return 400 for missing phone_last_4', async () => {
    const invalidBody = {
      tenant_id: 'simmerdown',
      check_in_date: '2025-10-01',
    }
    const request = createMockRequest(invalidBody)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.code).toBe('MISSING_FIELDS')
  })

  it('should return 400 for phone_last_4 not 4 digits', async () => {
    const invalidBody = {
      ...validRequestBody,
      phone_last_4: '123', // Only 3 digits
    }
    const request = createMockRequest(invalidBody)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('exactly 4 digits')
    expect(data.code).toBe('INVALID_PHONE_FORMAT')
  })

  it('should return 400 for phone_last_4 with non-digits', async () => {
    const invalidBody = {
      ...validRequestBody,
      phone_last_4: 'abcd', // Not digits
    }
    const request = createMockRequest(invalidBody)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.code).toBe('INVALID_PHONE_FORMAT')
  })

  it('should return 400 for invalid date format', async () => {
    const invalidBody = {
      ...validRequestBody,
      check_in_date: '10/01/2025', // Wrong format (should be YYYY-MM-DD)
    }
    const request = createMockRequest(invalidBody)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('YYYY-MM-DD format')
    expect(data.code).toBe('INVALID_DATE_FORMAT')
  })

  it('should return 400 for date without dashes', async () => {
    const invalidBody = {
      ...validRequestBody,
      check_in_date: '20251001', // Missing dashes
    }
    const request = createMockRequest(invalidBody)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.code).toBe('INVALID_DATE_FORMAT')
  })
})

// ============================================================================
// Tests: POST Handler - Authentication Failures
// ============================================================================

describe('POST /api/guest/login - Authentication Failures', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when no reservation found', async () => {
    ;(authenticateGuest as jest.Mock).mockResolvedValue(null)

    const request = createMockRequest(validRequestBody)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('No active reservation found')
    expect(data.code).toBe('NO_RESERVATION')
  })

  it('should return 401 for invalid credentials', async () => {
    ;(authenticateGuest as jest.Mock).mockResolvedValue(null)

    const request = createMockRequest({
      tenant_id: 'simmerdown',
      check_in_date: '2025-10-01',
      phone_last_4: '9999', // Wrong phone
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
  })
})

// ============================================================================
// Tests: POST Handler - Token Generation Errors
// ============================================================================

describe('POST /api/guest/login - Token Generation Errors', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(authenticateGuest as jest.Mock).mockResolvedValue(mockSession)
  })

  it('should return 500 when token generation fails', async () => {
    ;(generateGuestToken as jest.Mock).mockRejectedValue(
      new Error('JWT signing failed')
    )

    const request = createMockRequest(validRequestBody)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to generate authentication token')
    expect(data.code).toBe('TOKEN_GENERATION_FAILED')
  })
})

// ============================================================================
// Tests: POST Handler - Server Errors
// ============================================================================

describe('POST /api/guest/login - Server Errors', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 for invalid JSON', async () => {
    const request = {
      json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
    } as unknown as NextRequest

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid JSON in request body')
    expect(data.code).toBe('INVALID_JSON')
  })

  it('should return 500 for unexpected errors', async () => {
    const request = {
      json: jest.fn().mockRejectedValue(new Error('Unexpected database error')),
    } as unknown as NextRequest

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Internal server error')
    expect(data.code).toBe('INTERNAL_ERROR')
  })

  it('should handle authenticateGuest throwing error', async () => {
    ;(authenticateGuest as jest.Mock).mockRejectedValue(
      new Error('Database connection lost')
    )

    const request = createMockRequest(validRequestBody)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.code).toBe('INTERNAL_ERROR')
  })
})

// ============================================================================
// Tests: OPTIONS Handler (CORS)
// ============================================================================

describe('OPTIONS /api/guest/login - CORS', () => {
  it('should return 200 with CORS headers', async () => {
    const response = await OPTIONS()

    expect(response.status).toBe(200)
  })

  it('should include Access-Control-Allow-Origin header', async () => {
    const response = await OPTIONS()
    const headers = Object.fromEntries(response.headers.entries())

    expect(headers['access-control-allow-origin']).toBe('*')
  })

  it('should include Access-Control-Allow-Methods header', async () => {
    const response = await OPTIONS()
    const headers = Object.fromEntries(response.headers.entries())

    expect(headers['access-control-allow-methods']).toBe('POST, OPTIONS')
  })

  it('should include Access-Control-Allow-Headers header', async () => {
    const response = await OPTIONS()
    const headers = Object.fromEntries(response.headers.entries())

    expect(headers['access-control-allow-headers']).toContain('Content-Type')
    expect(headers['access-control-allow-headers']).toContain('Authorization')
  })
})

// ============================================================================
// Tests: Edge Cases & Security
// ============================================================================

describe('POST /api/guest/login - Edge Cases & Security', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(authenticateGuest as jest.Mock).mockResolvedValue(mockSession)
    ;(generateGuestToken as jest.Mock).mockResolvedValue('mock-token')
  })

  it('should handle extra fields in request body', async () => {
    const requestWithExtra = {
      ...validRequestBody,
      extra_field: 'should be ignored',
      malicious: '<script>alert("xss")</script>',
    }
    const request = createMockRequest(requestWithExtra)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should trim dates correctly (ISO format)', async () => {
    const request = createMockRequest(validRequestBody)

    const response = await POST(request)
    const data = await response.json()

    expect(data.guest_info.check_in).toBe('2025-10-01')
    expect(data.guest_info.check_out).toBe('2025-10-05')
  })

  it('should handle phone_last_4 as string (not number)', async () => {
    const requestWithStringPhone = {
      ...validRequestBody,
      phone_last_4: '0000', // Edge case: all zeros
    }
    const request = createMockRequest(requestWithStringPhone)

    const response = await POST(request)

    expect(response.status).toBe(200) // Should pass validation
  })

  it('should handle leap year dates correctly', async () => {
    const leapYearRequest = {
      ...validRequestBody,
      check_in_date: '2024-02-29', // Valid leap year date
    }
    const request = createMockRequest(leapYearRequest)

    const response = await POST(request)

    expect(response.status).toBe(200) // Should pass format validation
  })

  it('should not expose sensitive information in error messages', async () => {
    ;(authenticateGuest as jest.Mock).mockResolvedValue(null)

    const request = createMockRequest(validRequestBody)
    const response = await POST(request)
    const data = await response.json()

    // Error message should not expose database details or credentials
    expect(data.error).not.toContain('database')
    expect(data.error).not.toContain('password')
    expect(data.error).not.toContain('sql')
  })
})

// ============================================================================
// Integration-style Flow Tests
// ============================================================================

describe('POST /api/guest/login - Full Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should complete successful authentication flow', async () => {
    ;(authenticateGuest as jest.Mock).mockResolvedValue(mockSession)
    ;(generateGuestToken as jest.Mock).mockResolvedValue('final-token-xyz')

    const request = createMockRequest(validRequestBody)
    const response = await POST(request)
    const data = await response.json()

    // Verify complete response structure
    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      token: 'final-token-xyz',
      conversation_id: 'conv-456',
      guest_info: {
        name: 'John Doe',
        check_in: '2025-10-01',
        check_out: '2025-10-05',
        reservation_code: 'RES-001',
      },
    })

    // Verify function calls
    expect(authenticateGuest).toHaveBeenCalledTimes(1)
    expect(generateGuestToken).toHaveBeenCalledTimes(1)
  })

  it('should fail gracefully with invalid credentials', async () => {
    ;(authenticateGuest as jest.Mock).mockResolvedValue(null)

    const request = createMockRequest(validRequestBody)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(generateGuestToken).not.toHaveBeenCalled()
  })

  it('should validate before authenticating', async () => {
    const invalidRequest = createMockRequest({
      tenant_id: 'simmerdown',
      check_in_date: '2025-10-01',
      phone_last_4: 'abc', // Invalid
    })

    const response = await POST(invalidRequest)

    expect(response.status).toBe(400)
    expect(authenticateGuest).not.toHaveBeenCalled() // Should not reach auth
  })
})
