import { NextRequest, NextResponse } from 'next/server'
import { generateEmbedding } from '@/lib/openai'
import { searchDocuments } from '@/lib/supabase'
import { generateChatResponse } from '@/lib/claude'
// import { kv } from '@vercel/kv'  // Disabled until KV is available
// import crypto from 'crypto' // Not available in Edge Runtime

export const runtime = 'edge'

// Simple in-memory cache (resets on deployment)
const memoryCache = new Map<string, { data: any, expires: number }>()

// Simple hash function for cache keys (Edge Runtime compatible)
function hashQuestion(question: string): string {
  const str = question.toLowerCase().trim()
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

// Memory cache helpers
function getCached(key: string) {
  const cached = memoryCache.get(key)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }
  if (cached) {
    memoryCache.delete(key) // Clean expired
  }
  return null
}

function setCached(key: string, data: any, ttlSeconds: number = 3600) {
  memoryCache.set(key, {
    data,
    expires: Date.now() + (ttlSeconds * 1000)
  })
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
    const cached = getCached(cacheKey)
    if (cached) {
      console.log('Memory cache hit for question:', question.substring(0, 50))
      return NextResponse.json(cached)
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

    // Save to memory cache (1 hour TTL)
    setCached(cacheKey, result, 3600)
    console.log('Saved to memory cache for question:', question.substring(0, 50))

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