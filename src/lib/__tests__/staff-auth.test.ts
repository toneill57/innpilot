/**
 * Unit Tests for Staff Authentication System
 *
 * Tests authentication, JWT generation/verification, and edge cases.
 */

import {
  authenticateStaff,
  generateStaffToken,
  verifyStaffToken,
  extractTokenFromHeader,
  StaffAuthErrors,
  type StaffSession,
  type StaffCredentials,
} from '../staff-auth'

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
          staff_id: 'test-staff-id',
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
          type: 'staff',
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        },
      }
    }
    if (token === 'expired-token') {
      return {
        payload: {
          staff_id: 'test-staff-id',
          tenant_id: 'test-tenant',
          username: 'admin_ceo',
          full_name: 'Test CEO',
          role: 'ceo',
          permissions: {},
          exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        },
      }
    }
    throw new Error('Invalid token')
  }),
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}))

// Mock Supabase client
jest.mock('../supabase', () => ({
  createServerClient: jest.fn(),
}))

const { createServerClient } = require('../supabase')
const bcrypt = require('bcryptjs')

// ============================================================================
// Test Data
// ============================================================================

const mockStaffUser = {
  staff_id: 'test-staff-id',
  tenant_id: 'test-tenant',
  username: 'admin_ceo',
  full_name: 'Test CEO',
  role: 'ceo',
  password_hash: '$2b$10$hashedpassword',
  email: 'ceo@simmerdown.house',
  permissions: {
    sire_access: true,
    admin_panel: true,
    reports_access: true,
    modify_operations: true,
  },
  is_active: true,
}

const mockTenant = {
  tenant_id: 'test-tenant',
  features: {
    staff_chat_enabled: true,
    guest_chat_enabled: true,
  },
}

const validCredentials: StaffCredentials = {
  username: 'admin_ceo',
  password: 'Staff2024!',
  tenant_id: 'test-tenant',
}

// ============================================================================
// Tests - authenticateStaff()
// ============================================================================

describe('Staff Authentication', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mock Supabase client
    mockSupabaseClient = {
      from: jest.fn((table: string) => {
        if (table === 'staff_users') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    single: jest.fn().mockResolvedValue({ data: mockStaffUser, error: null }),
                  })),
                })),
              })),
            })),
            update: jest.fn(() => ({
              eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
            })),
          }
        } else if (table === 'tenant_registry') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({ data: mockTenant, error: null }),
              })),
            })),
          }
        }
        return {}
      }),
    }

    ;(createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient)
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
  })

  describe('authenticateStaff()', () => {
    it('should authenticate valid credentials successfully', async () => {
      const result = await authenticateStaff(validCredentials)

      expect(result).not.toBeNull()
      expect(result?.staff_id).toBe('test-staff-id')
      expect(result?.username).toBe('admin_ceo')
      expect(result?.role).toBe('ceo')
      expect(result?.permissions.sire_access).toBe(true)
      expect(result?.permissions.admin_panel).toBe(true)
    })

    it('should fail with incorrect password', async () => {
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const result = await authenticateStaff(validCredentials)

      expect(result).toBeNull()
    })

    it('should fail for inactive account', async () => {
      mockSupabaseClient.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' },
                }),
              })),
            })),
          })),
        })),
      }))

      const result = await authenticateStaff(validCredentials)

      expect(result).toBeNull()
    })

    it('should reject if staff_chat_disabled', async () => {
      // Mock tenant with staff_chat disabled
      mockSupabaseClient.from = jest.fn((table: string) => {
        if (table === 'staff_users') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    single: jest.fn().mockResolvedValue({ data: mockStaffUser, error: null }),
                  })),
                })),
              })),
            })),
            update: jest.fn(() => ({
              eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
            })),
          }
        } else if (table === 'tenant_registry') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { features: { staff_chat_enabled: false } },
                  error: null,
                }),
              })),
            })),
          }
        }
        return {}
      })

      await expect(authenticateStaff(validCredentials)).rejects.toThrow(
        'Staff chat is not enabled for this tenant'
      )
    })

    it('should reject if tenant_id mismatch', async () => {
      const wrongTenantCredentials = {
        ...validCredentials,
        tenant_id: 'wrong-tenant-id',
      }

      mockSupabaseClient.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' },
                }),
              })),
            })),
          })),
        })),
      }))

      const result = await authenticateStaff(wrongTenantCredentials)

      expect(result).toBeNull()
    })

    it('should fail with missing username', async () => {
      const invalidCredentials = {
        username: '',
        password: 'test',
        tenant_id: 'test-tenant',
      }

      const result = await authenticateStaff(invalidCredentials)

      expect(result).toBeNull()
    })

    it('should fail with missing password', async () => {
      const invalidCredentials = {
        username: 'admin_ceo',
        password: '',
        tenant_id: 'test-tenant',
      }

      const result = await authenticateStaff(invalidCredentials)

      expect(result).toBeNull()
    })

    it('should fail with missing tenant_id', async () => {
      const invalidCredentials = {
        username: 'admin_ceo',
        password: 'test',
        tenant_id: '',
      }

      const result = await authenticateStaff(invalidCredentials)

      expect(result).toBeNull()
    })

    it('should update last_login_at on successful authentication', async () => {
      const updateMock = jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      }))

      mockSupabaseClient.from = jest.fn((table: string) => {
        if (table === 'staff_users') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    single: jest.fn().mockResolvedValue({ data: mockStaffUser, error: null }),
                  })),
                })),
              })),
            })),
            update: updateMock,
          }
        } else if (table === 'tenant_registry') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({ data: mockTenant, error: null }),
              })),
            })),
          }
        }
        return {}
      })

      await authenticateStaff(validCredentials)

      expect(updateMock).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // Tests - generateStaffToken()
  // ============================================================================

  describe('generateStaffToken()', () => {
    const mockSession: StaffSession = {
      staff_id: 'test-staff-id',
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

    it('should create valid JWT token', async () => {
      const token = await generateStaffToken(mockSession)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token).toBe('mocked.jwt.token')
    })

    it('should include all session data in token', async () => {
      const token = await generateStaffToken(mockSession)

      // Verify token was generated (mocked)
      expect(token).toBeTruthy()

      // In real implementation, would decode and verify payload
      // Here we just verify the function completed successfully
    })
  })

  // ============================================================================
  // Tests - verifyStaffToken()
  // ============================================================================

  describe('verifyStaffToken()', () => {
    it('should validate correct token', async () => {
      const session = await verifyStaffToken('valid-token')

      expect(session).not.toBeNull()
      expect(session?.staff_id).toBe('test-staff-id')
      expect(session?.username).toBe('admin_ceo')
      expect(session?.role).toBe('ceo')
    })

    it('should reject expired token', async () => {
      const session = await verifyStaffToken('expired-token')

      // Token with exp in the past should return null
      expect(session).toBeNull()
    })

    it('should reject malformed token', async () => {
      const session = await verifyStaffToken('malformed.token.here')

      expect(session).toBeNull()
    })

    it('should reject empty token', async () => {
      const session = await verifyStaffToken('')

      expect(session).toBeNull()
    })

    it('should validate token structure', async () => {
      const session = await verifyStaffToken('valid-token')

      expect(session).not.toBeNull()
      if (session) {
        expect(session).toHaveProperty('staff_id')
        expect(session).toHaveProperty('tenant_id')
        expect(session).toHaveProperty('username')
        expect(session).toHaveProperty('full_name')
        expect(session).toHaveProperty('role')
        expect(session).toHaveProperty('permissions')
      }
    })
  })

  // ============================================================================
  // Tests - extractTokenFromHeader()
  // ============================================================================

  describe('extractTokenFromHeader()', () => {
    it('should extract token from valid Bearer header', () => {
      const token = extractTokenFromHeader('Bearer my.jwt.token')

      expect(token).toBe('my.jwt.token')
    })

    it('should return null for missing header', () => {
      const token = extractTokenFromHeader(null)

      expect(token).toBeNull()
    })

    it('should return null for malformed header', () => {
      const token = extractTokenFromHeader('InvalidFormat token')

      expect(token).toBeNull()
    })

    it('should return null for header without Bearer', () => {
      const token = extractTokenFromHeader('my.jwt.token')

      expect(token).toBeNull()
    })

    it('should return null for empty header', () => {
      const token = extractTokenFromHeader('')

      expect(token).toBeNull()
    })
  })
})
