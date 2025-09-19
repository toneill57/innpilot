import { POST } from '@/app/api/chat/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/openai', () => ({
  generateEmbedding: jest.fn()
}))

jest.mock('@/lib/supabase', () => ({
  searchDocuments: jest.fn()
}))

jest.mock('@/lib/claude', () => ({
  generateChatResponse: jest.fn()
}))

describe('/api/chat', () => {
  const { generateEmbedding } = require('@/lib/openai')
  const { searchDocuments } = require('@/lib/supabase')
  const { generateChatResponse } = require('@/lib/claude')

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock implementations
    generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3])
    searchDocuments.mockResolvedValue([
      {
        content: 'Test document content',
        metadata: { source: 'test.pdf' }
      }
    ])
    generateChatResponse.mockResolvedValue('Test response from Claude')
  })

  it('should handle valid chat request', async () => {
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
    expect(data.response).toBe('Test response from Claude')
    expect(data.context_used).toBe(true)
    expect(data.question).toBe(requestBody.question)

    expect(generateEmbedding).toHaveBeenCalledWith(requestBody.question)
    expect(searchDocuments).toHaveBeenCalledWith([0.1, 0.2, 0.3], 0.3, 3)
    expect(generateChatResponse).toHaveBeenCalledWith(
      requestBody.question,
      'Test document content'
    )
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
    expect(searchDocuments).not.toHaveBeenCalled()
    expect(generateChatResponse).toHaveBeenCalledWith('Test question', '')
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

  it('should handle errors gracefully', async () => {
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

    expect(response.status).toBe(500)
    expect(data.error).toBe('Error al generar embeddings')
    expect(data.details).toBe('OpenAI error')
    expect(data.timestamp).toBeDefined()
    expect(data.response_time).toBeDefined()
  })

  it('should use semantic cache for repeated questions', async () => {
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
    const data2 = await response2.json()

    expect(response2.status).toBe(200)
    expect(data2.response).toBe('Test response from Claude')

    // Should only be called once (from first request)
    expect(generateEmbedding).toHaveBeenCalledTimes(1)
  })
})