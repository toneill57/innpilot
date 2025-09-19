import { POST } from '@/app/api/validate/route'
import { NextRequest } from 'next/server'

// Mock utils
jest.mock('@/lib/utils', () => ({
  validateSireFormat: jest.fn()
}))

describe('/api/validate', () => {
  const { validateSireFormat } = require('@/lib/utils')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should validate valid SIRE file', async () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })

    validateSireFormat.mockReturnValue({
      isValid: true,
      errors: [],
      lineCount: 10,
      processedRecords: 10
    })

    const formData = new FormData()
    formData.append('file', mockFile)

    const request = new NextRequest('http://localhost:3000/api/validate', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.isValid).toBe(true)
    expect(data.errors).toEqual([])
    expect(data.lineCount).toBe(10)
    expect(data.fileName).toBe('test.txt')
    expect(data.fileSize).toBe(12) // 'test content'.length
  })

  it('should handle validation errors', async () => {
    const mockFile = new File(['invalid content'], 'test.txt', { type: 'text/plain' })

    validateSireFormat.mockReturnValue({
      isValid: false,
      errors: ['Error en línea 1: Formato inválido', 'Error en línea 2: Campo faltante'],
      lineCount: 2,
      processedRecords: 0
    })

    const formData = new FormData()
    formData.append('file', mockFile)

    const request = new NextRequest('http://localhost:3000/api/validate', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.isValid).toBe(false)
    expect(data.errors).toHaveLength(2)
    expect(data.errors[0]).toBe('Error en línea 1: Formato inválido')
  })

  it('should return 400 for missing file', async () => {
    const formData = new FormData()

    const request = new NextRequest('http://localhost:3000/api/validate', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('No file provided')
  })

  it('should return 400 for invalid file type', async () => {
    const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })

    const formData = new FormData()
    formData.append('file', mockFile)

    const request = new NextRequest('http://localhost:3000/api/validate', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid file type')
    expect(data.message).toBe('Only .txt files are allowed')
  })

  it('should return 400 for file too large', async () => {
    // Create a mock file larger than 10MB
    const largeContent = 'x'.repeat(11 * 1024 * 1024) // 11MB
    const mockFile = new File([largeContent], 'large.txt', { type: 'text/plain' })

    const formData = new FormData()
    formData.append('file', mockFile)

    const request = new NextRequest('http://localhost:3000/api/validate', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('File too large')
    expect(data.message).toBe('Maximum file size is 10MB')
  })

  it('should handle validation function errors', async () => {
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })

    validateSireFormat.mockImplementation(() => {
      throw new Error('Validation error')
    })

    const formData = new FormData()
    formData.append('file', mockFile)

    const request = new NextRequest('http://localhost:3000/api/validate', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
    expect(data.message).toContain('Error processing file')
  })
})