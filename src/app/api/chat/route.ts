import { NextRequest, NextResponse } from 'next/server'
import { generateEmbedding } from '@/lib/openai'
import { searchDocuments } from '@/lib/supabase'
import { generateChatResponse } from '@/lib/claude'
// Note: Vercel KV not implemented - using memory cache only

export const runtime = 'edge'

// Legacy in-memory cache (fallback for Edge Runtime)
const memoryCache = new Map<string, { data: unknown, expires: number }>()

// Semantic question groups for intelligent caching
const SEMANTIC_GROUPS = {
  "campos_obligatorios": [
    "cuáles son los 13 campos",
    "qué campos obligatorios tiene sire",
    "cuáles son las especificaciones de campos",
    "campos requeridos",
    "información obligatoria",
    "datos que debo registrar"
  ],
  "tipos_documento": [
    "qué documentos son válidos",
    "cuáles son los códigos de documento",
    "qué tipos de identificación acepta sire",
    "documentos permitidos",
    "tipos de documento",
    "códigos válidos"
  ],
  "formato_archivo": [
    "formato del archivo",
    "cómo debe ser el archivo",
    "extensión del archivo",
    "tipo de archivo",
    "estructura del archivo"
  ],
  "errores_validacion": [
    "errores de validación",
    "por qué falla la validación",
    "archivo no válido",
    "problemas con el archivo"
  ]
}

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

// Enhanced semantic cache key generation
function getSemanticCacheKey(question: string): string {
  const normalizedQuestion = question.toLowerCase().trim()

  // Check if question matches any semantic group
  for (const [groupKey, patterns] of Object.entries(SEMANTIC_GROUPS)) {
    for (const pattern of patterns) {
      if (normalizedQuestion.includes(pattern)) {
        return `semantic:${groupKey}`
      }
    }
  }

  // Fallback to exact match hash
  return `exact:${hashQuestion(question)}`
}

// Memory cache helpers (Edge Runtime compatible)
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

function setCached(key: string, data: unknown, ttlSeconds: number = 3600) {
  memoryCache.set(key, {
    data,
    expires: Date.now() + (ttlSeconds * 1000)
  })
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  try {
    console.log(`[${timestamp}] Chat API request started`)

    const { question, use_context = true, max_context_chunks = 4 } = await request.json()

    if (!question || typeof question !== 'string') {
      console.log(`[${timestamp}] Invalid request: missing or invalid question`)
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      )
    }

    console.log(`[${timestamp}] Processing question: "${question.substring(0, 100)}${question.length > 100 ? '...' : ''}"`)

    // Check cache first (using semantic grouping)
    const cacheKey = `chat:${getSemanticCacheKey(question)}`
    const cached = getCached(cacheKey)
    if (cached) {
      const responseTime = Date.now() - startTime
      console.log(`[${timestamp}] ✅ Semantic cache hit - Response time: ${responseTime}ms`)

      // Add performance metrics to cached response
      const cachedWithMetrics = {
        ...cached,
        performance: {
          ...((cached as any).performance || {}),
          total_time_ms: responseTime,
          cache_hit: true,
          environment: process.env.NODE_ENV || 'unknown',
          timestamp: timestamp,
          cache_stats: process.env.NODE_ENV !== 'production' ? {
            memory_cache_size: memoryCache.size,
            cache_type: 'memory_only'
          } : undefined
        }
      }

      return NextResponse.json(cachedWithMetrics)
    }

    let context = ''
    let response = ''

    if (use_context) {
      try {
        const embeddingStart = Date.now()
        console.log(`[${timestamp}] 🔍 Generating embedding...`)

        // Generar embedding de la pregunta
        const queryEmbedding = await generateEmbedding(question)
        const embeddingTime = Date.now() - embeddingStart
        console.log(`[${timestamp}] ✅ Embedding generated - Time: ${embeddingTime}ms`)

        const searchStart = Date.now()
        console.log(`[${timestamp}] 🔎 Searching documents...`)

        // Buscar documentos relevantes (threshold más bajo para mejor recall)
        const documents = await searchDocuments(
          queryEmbedding,
          0.3, // threshold reducido para mejor búsqueda
          max_context_chunks
        )
        const searchTime = Date.now() - searchStart
        console.log(`[${timestamp}] ✅ Found ${documents.length} relevant documents - Search time: ${searchTime}ms`)

        // Construir contexto
        context = documents
          .map(doc => doc.content)
          .join('\n\n')

        const claudeStart = Date.now()
        console.log(`[${timestamp}] 🤖 Generating Claude response...`)

        // Generar respuesta con Claude (usando el contexto encontrado)
        response = await generateChatResponse(question, context)
        const claudeTime = Date.now() - claudeStart
        console.log(`[${timestamp}] ✅ Claude response generated - Time: ${claudeTime}ms`)

      } catch (error) {
        console.error(`[${timestamp}] ❌ Error in context processing:`, error)
        console.log(`[${timestamp}] 🔄 Falling back to response without context`)

        try {
          // Continuar sin contexto si hay error en la búsqueda
          response = await generateChatResponse(question, '')
        } catch (fallbackError) {
          console.error(`[${timestamp}] ❌ Fatal error in fallback response:`, fallbackError)
          throw fallbackError
        }
      }
    } else {
      console.log(`[${timestamp}] 🤖 Generating response without context...`)
      const claudeStart = Date.now()

      // No context needed - generate response immediately
      response = await generateChatResponse(question, '')
      const claudeTime = Date.now() - claudeStart
      console.log(`[${timestamp}] ✅ Response generated - Time: ${claudeTime}ms`)
    }

    const totalTime = Date.now() - startTime

    const result = {
      response,
      context_used: context.length > 0,
      question,
      // Enhanced performance metrics
      performance: {
        total_time_ms: totalTime,
        cache_hit: false, // This is a new response, not cached
        environment: process.env.NODE_ENV || 'unknown',
        timestamp: timestamp,
        // Cache statistics
        cache_stats: process.env.NODE_ENV !== 'production' ? {
          memory_cache_size: memoryCache.size,
          cache_type: 'memory_only'
        } : undefined
      }
    }

    // Save to semantic cache (1 hour TTL)
    setCached(cacheKey, result, 3600)

    console.log(`[${timestamp}] ✅ Request completed successfully - Total time: ${totalTime}ms`)
    console.log(`[${timestamp}] 💾 Saved to semantic cache`)

    return NextResponse.json(result)

  } catch (error) {
    const errorTime = Date.now() - startTime
    console.error(`[${timestamp}] ❌ Fatal error in chat API (${errorTime}ms):`, error)

    // Provide more specific error messages based on error type
    let errorMessage = 'Error interno del servidor'
    const errorDetails = error instanceof Error ? error.message : 'Unknown error'

    if (error instanceof Error) {
      if (error.message.includes('OPENAI')) {
        errorMessage = 'Error al generar embeddings'
      } else if (error.message.includes('Anthropic') || error.message.includes('Claude')) {
        errorMessage = 'Error al generar respuesta'
      } else if (error.message.includes('Supabase') || error.message.includes('database')) {
        errorMessage = 'Error en la base de datos'
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
        response_time: errorTime
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