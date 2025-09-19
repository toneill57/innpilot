import { NextRequest, NextResponse } from 'next/server'
import { generateEmbedding } from '@/lib/openai'
import { searchDocuments } from '@/lib/supabase'
import { generateChatResponse } from '@/lib/claude'
import { kv } from '@vercel/kv'
import crypto from 'crypto'

export const runtime = 'edge'

// Hash function for cache keys
function hashQuestion(question: string): string {
  return crypto.createHash('md5').update(question.toLowerCase().trim()).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const { question, use_context = true, max_context_chunks = 3 } = await request.json()

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      )
    }

    // Check cache first
    const cacheKey = `chat:${hashQuestion(question)}`
    try {
      const cached = await kv.get(cacheKey)
      if (cached) {
        console.log('Cache hit for question:', question.substring(0, 50))
        return NextResponse.json(cached)
      }
    } catch (cacheError) {
      console.warn('Cache read error:', cacheError)
      // Continue without cache
    }

    let context = ''

    if (use_context) {
      try {
        // Generar embedding de la pregunta
        const queryEmbedding = await generateEmbedding(question)

        // Buscar documentos relevantes (threshold más bajo para mejor recall)
        const documents = await searchDocuments(
          queryEmbedding,
          0.3, // threshold reducido para mejor búsqueda
          max_context_chunks
        )

        // Construir contexto
        context = documents
          .map(doc => doc.content)
          .join('\n\n')

        console.log(`Found ${documents.length} relevant documents for question: ${question.substring(0, 100)}...`)
      } catch (error) {
        console.error('Error searching documents:', error)
        // Continuar sin contexto si hay error en la búsqueda
      }
    }

    // Generar respuesta con Claude
    const response = await generateChatResponse(question, context)

    const result = {
      response,
      context_used: context.length > 0,
      question
    }

    // Save to cache (1 hour TTL)
    try {
      await kv.set(cacheKey, result, { ex: 3600 })
      console.log('Cached response for question:', question.substring(0, 50))
    } catch (cacheError) {
      console.warn('Cache write error:', cacheError)
      // Continue without caching
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in chat API:', error)

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Chat API endpoint - Use POST method',
    endpoints: {
      'POST /api/chat': 'Send a question to the SIRE assistant'
    }
  })
}