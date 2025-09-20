// MUVA Tourism Chat API Route
// Handles tourism-related questions for San Andrés and Colombian destinations
// Uses separate embeddings table and specialized search functions

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { searchMuvaContent, isMuvaQuestion, formatMuvaResponse, type MuvaSearchOptions } from '@/lib/muva-utils'

export const runtime = 'edge'

interface MuvaChatRequest {
  question: string
  category?: string
  location?: string
  city?: string
  min_rating?: number
  price_range?: string
}

interface MuvaChatResponse {
  answer: string
  context_used: boolean
  context_count: number
  performance: {
    total_time_ms: number
    embedding_time_ms: number
    search_time_ms: number
    claude_time_ms: number
    cache_hit?: boolean
  }
  metadata: {
    category_filter?: string
    location_filter?: string
    results_found: number
    search_strategy: string
  }
}

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { question, category, location, city, min_rating, price_range }: MuvaChatRequest = await request.json()

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    console.log(`[MUVA] Processing tourism question: "${question}"`)
    console.log(`[MUVA] Filters - category: ${category}, location: ${location}`)

    // Validate this is a tourism question
    if (!isMuvaQuestion(question)) {
      return NextResponse.json({
        answer: "Esta pregunta parece ser sobre temas no turísticos. El Asistente MUVA está especializado en información turística de San Andrés y destinos colombianos. ¿Te puedo ayudar con recomendaciones de restaurantes, atracciones, actividades o información de viaje?",
        context_used: false,
        context_count: 0,
        performance: {
          total_time_ms: Date.now() - startTime,
          embedding_time_ms: 0,
          search_time_ms: 0,
          claude_time_ms: 0
        },
        metadata: {
          results_found: 0,
          search_strategy: 'non_tourism_question'
        }
      })
    }

    // Step 1: Generate embedding for the question
    const embeddingStart = Date.now()
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: question,
      dimensions: 3072
    })
    const queryEmbedding = embeddingResponse.data[0].embedding
    const embeddingTime = Date.now() - embeddingStart

    console.log(`[MUVA] Embedding generated in ${embeddingTime}ms`)

    // Step 2: Search tourism content
    const searchStart = Date.now()
    const searchOptions: MuvaSearchOptions = {
      category: category as any,
      location,
      city,
      min_rating,
      match_count: 6,
      match_threshold: 0.25 // Slightly lower threshold for tourism content
    }

    const searchResults = await searchMuvaContent(queryEmbedding, searchOptions)
    const searchTime = Date.now() - searchStart

    console.log(`[MUVA] Search completed in ${searchTime}ms, found ${searchResults.length} results`)

    if (searchResults.length === 0) {
      return NextResponse.json({
        answer: "No encontré información específica sobre esa consulta turística en mi base de datos. ¿Podrías reformular tu pregunta o ser más específico sobre qué aspecto del turismo en San Andrés te interesa?",
        context_used: false,
        context_count: 0,
        performance: {
          total_time_ms: Date.now() - startTime,
          embedding_time_ms: embeddingTime,
          search_time_ms: searchTime,
          claude_time_ms: 0
        },
        metadata: {
          category_filter: category,
          location_filter: location,
          results_found: 0,
          search_strategy: 'vector_search_no_results'
        }
      })
    }

    // Step 3: Generate response with Claude
    const claudeStart = Date.now()

    // Build context from search results
    const context = searchResults.map(result => {
      let contextStr = `**${result.title || 'Información Turística'}**\n`

      if (result.description) {
        contextStr += `Descripción: ${result.description}\n`
      }

      contextStr += `Contenido: ${result.content}\n`

      if (result.category) {
        contextStr += `Categoría: ${result.category}\n`
      }

      if (result.location) {
        contextStr += `Ubicación: ${result.location}\n`
      }

      if (result.rating) {
        contextStr += `Calificación: ${result.rating}/5 estrellas\n`
      }

      if (result.price_range) {
        contextStr += `Rango de precio: ${result.price_range}\n`
      }

      if (result.opening_hours) {
        contextStr += `Horarios: ${result.opening_hours}\n`
      }

      if (result.contact_info) {
        contextStr += `Contacto: ${JSON.stringify(result.contact_info)}\n`
      }

      if (result.tags && result.tags.length > 0) {
        contextStr += `Tags: ${result.tags.join(', ')}\n`
      }

      return contextStr
    }).join('\n---\n')

    const systemPrompt = `Eres MUVA, un asistente turístico especializado en San Andrés, Providencia y destinos colombianos.

Tu misión es ayudar a turistas y viajeros con:
- Recomendaciones de restaurantes y gastronomía local
- Atracciones turísticas y lugares para visitar
- Actividades y experiencias únicas
- Información sobre hoteles y alojamiento
- Guías de transporte y movilidad
- Vida nocturna y entretenimiento
- Compras y mercados locales
- Cultura, historia y tradiciones
- Naturaleza, playas y aventuras

INSTRUCCIONES:
1. Responde SOLO en español
2. Usa un tono amigable, entusiasta y conocedor
3. Incluye emojis relevantes para hacer la respuesta más atractiva
4. Proporciona información práctica y específica
5. Si mencionas lugares, incluye detalles como ubicación, horarios, precios cuando estén disponibles
6. Organiza la información de manera clara y fácil de leer
7. Si no tienes información específica, sugiere alternativas relacionadas
8. Siempre enfócate en el aspecto turístico y de experiencia del viajero

Contexto turístico disponible:
${context}

Pregunta del usuario: ${question}`

    const claudeResponse = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-5-haiku-20241022',
      max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '1000'),
      messages: [
        {
          role: 'user',
          content: systemPrompt
        }
      ]
    })

    const claudeTime = Date.now() - claudeStart
    const totalTime = Date.now() - startTime

    console.log(`[MUVA] Claude response generated in ${claudeTime}ms`)
    console.log(`[MUVA] Total request time: ${totalTime}ms`)

    const answer = claudeResponse.content[0].type === 'text'
      ? claudeResponse.content[0].text
      : 'Error al generar respuesta'

    return NextResponse.json({
      answer,
      context_used: true,
      context_count: searchResults.length,
      performance: {
        total_time_ms: totalTime,
        embedding_time_ms: embeddingTime,
        search_time_ms: searchTime,
        claude_time_ms: claudeTime
      },
      metadata: {
        category_filter: category,
        location_filter: location,
        results_found: searchResults.length,
        search_strategy: 'vector_search_with_context'
      }
    })

  } catch (error) {
    console.error('[MUVA] Error processing tourism question:', error)

    return NextResponse.json({
      answer: "Disculpa, hubo un error procesando tu consulta turística. Por favor intenta nuevamente en unos momentos.",
      context_used: false,
      context_count: 0,
      performance: {
        total_time_ms: Date.now() - startTime,
        embedding_time_ms: 0,
        search_time_ms: 0,
        claude_time_ms: 0
      },
      metadata: {
        results_found: 0,
        search_strategy: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'MUVA Tourism Assistant',
    status: 'active',
    description: 'Asistente turístico para San Andrés y destinos colombianos',
    version: '1.0.0',
    endpoints: {
      chat: 'POST /api/muva/chat',
      health: 'GET /api/muva/health'
    },
    capabilities: [
      'Recomendaciones de restaurantes',
      'Guías de atracciones turísticas',
      'Información de actividades',
      'Consejos de viaje',
      'Búsqueda por categoría y ubicación',
      'Información práctica (horarios, precios, contacto)'
    ]
  })
}