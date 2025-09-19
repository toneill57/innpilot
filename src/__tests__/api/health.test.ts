import { GET } from '@/app/api/health/route'
import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => Promise.resolve({
          data: [{ id: 1 }],
          error: null
        }))
      }))
    }))
  }
}))

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock performance.now for consistent timing
    global.performance = {
      now: jest.fn()
        .mockReturnValueOnce(0)  // Start time
        .mockReturnValueOnce(100) // End time
    } as any
  })

  it('should return healthy status', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy')
    expect(data.services.supabase.status).toBe('healthy')
    expect(data.services.openai.status).toBe('configured')
    expect(data.services.anthropic.status).toBe('configured')
    expect(data.environment.runtime).toBe('edge')
    expect(data.timestamp).toBeDefined()
  })

  it('should include response time for supabase', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(data.services.supabase.responseTime).toBe('100ms')
  })

  it('should handle supabase connection errors', async () => {
    // Mock Supabase error
    const mockSupabase = require('@/lib/supabase')
    mockSupabase.supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        limit: jest.fn(() => Promise.resolve({
          data: null,
          error: { message: 'Connection failed' }
        }))
      }))
    })

    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(data.services.supabase.status).toBe('unhealthy')
    expect(data.services.supabase.error).toBe('Connection failed')
  })
})