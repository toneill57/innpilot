import { POST } from '@/app/api/chat/route'
import { NextRequest } from 'next/server'

// Mock Anthropic SDK before any imports that use it
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn()
      }
    }))
  }
})

// Mock dependencies
jest.mock('@/lib/openai', () => ({
  generateEmbedding: jest.fn()
}))

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: jest.fn()
  }
}))

jest.mock('@/lib/claude', () => ({
  generateChatResponse: jest.fn()
}))

jest.mock('@/lib/query-intent', () => ({
  detectQueryIntent: jest.fn().mockResolvedValue({
    intent: 'general',
    confidence: 0.8
  })
}))

describe('/api/chat', () => {
  const { generateEmbedding } = require('@/lib/openai')
  const { supabase } = require('@/lib/supabase')
  const { generateChatResponse } = require('@/lib/claude')

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock implementations
    generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3])
    supabase.rpc.mockResolvedValue({
      data: [
        {
          content: 'Test document content',
          metadata: { source: 'test.pdf' }
        }
      ],
      error: null
    })
    generateChatResponse.mockResolvedValue('Test response from Claude')
  })

  // TODO: This test needs updating - chat route has evolved significantly
  it.skip('should handle valid chat request', async () => {
    const requestBody = {
      question: '¿Cuáles son los documentos válidos para SIRE?',
      use_context: true,
      max_context_chunks: 3
    }

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.response).toBeDefined()
    expect(data.question).toBe(requestBody.question)
  })

  it('should handle request without context', async () => {
    const requestBody = {
      question: 'Test question',
      use_context: false
    }

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.context_used).toBe(false)
    expect(generateEmbedding).not.toHaveBeenCalled()
    expect(supabase.rpc).not.toHaveBeenCalled()
    expect(generateChatResponse).toHaveBeenCalledWith('Test question', '', 'unified')
  })

  it('should return 400 for missing question', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Question is required and must be a string')
  })

  it('should return 400 for invalid question type', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 123 })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Question is required and must be a string')
  })

  // TODO: This test needs updating - error handling has changed
  it.skip('should handle errors gracefully', async () => {
    generateEmbedding.mockRejectedValue(new Error('OpenAI error'))

    const requestBody = {
      question: 'Test question',
      use_context: true
    }

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBeGreaterThanOrEqual(400)
    expect(data.error || data.details).toBeDefined()
  })

  // TODO: Semantic cache test needs rewriting for new architecture
  it.skip('should use semantic cache for repeated questions', async () => {
    const requestBody = {
      question: '¿Cuáles son los 7 pasos oficiales para reportar información al SIRE?',
      use_context: true
    }

    const request1 = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    // First request
    await POST(request1)

    // Second request (should hit cache)
    const request2 = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    const response2 = await POST(request2)

    expect(response2.status).toBe(200)
  })
})