/**
 * Dev Chat Engine
 *
 * Development version of public chat engine for testing improvements.
 * Marketing-focused conversational chat for public/anonymous visitors.
 * Includes travel intent extraction.
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  getOrCreateDevSession,
  updateDevSession,
  extractTravelIntent,
  type DevSession,
} from './dev-chat-session'
import {
  performDevSearch,
  type VectorSearchResult,
} from './dev-chat-search'

// ============================================================================
// Configuration
// ============================================================================

// Lazy initialization for Anthropic client
let anthropic: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })
  }
  return anthropic
}


// ============================================================================
// Types & Interfaces
// ============================================================================

export interface DevChatResponse {
  session_id: string
  response: string
  sources: Array<{
    table: string
    id: string
    name: string
    content: string
    similarity: number
    pricing?: {
      base_price_night: number
      currency: string
    }
    photos?: Array<{ url: string }>
  }>
  travel_intent: {
    check_in: string | null
    check_out: string | null
    guests: number | null
    accommodation_type: string | null
    captured_this_message: boolean
  }
  suggestions: string[]
}

// ============================================================================
// Main Engine Function
// ============================================================================

/**
 * Generate dev chat response with marketing focus
 *
 * @param message - User's message
 * @param sessionId - Optional existing session ID
 * @param tenantId - Tenant ID for multi-tenant support
 * @returns DevChatResponse with response, intent, sources, and suggestions
 */
export async function generateDevChatResponse(
  message: string,
  sessionId: string | undefined,
  tenantId: string
): Promise<DevChatResponse> {
  const startTime = Date.now()

  console.log('[dev-chat-engine] Processing message:', message.substring(0, 80))
  console.log('[dev-chat-engine] Session:', sessionId, 'Tenant:', tenantId)

  try {
    // STEP 1: Get or create session
    const session = await getOrCreateDevSession(sessionId, tenantId)
    console.log('[dev-chat-engine] Session loaded:', session.session_id)

    // STEP 2: Perform dev search
    const searchResults = await performDevSearch(message, session)
    console.log('[dev-chat-engine] Search found:', searchResults.length, 'results')

    // STEP 3: Extract travel intent
    const extractedIntent = await extractTravelIntent(message)
    const intentCaptured = Object.values(extractedIntent).some((v) => v !== null)
    console.log('[dev-chat-engine] Intent captured:', intentCaptured, extractedIntent)

    // STEP 4: Merge with existing intent
    const mergedIntent: DevSession['travel_intent'] = {
      ...session.travel_intent,
      check_in: extractedIntent.check_in || session.travel_intent.check_in,
      check_out: extractedIntent.check_out || session.travel_intent.check_out,
      guests: extractedIntent.guests || session.travel_intent.guests,
      accommodation_type: extractedIntent.accommodation_type || session.travel_intent.accommodation_type,
      budget_range: session.travel_intent.budget_range,
      preferences: session.travel_intent.preferences,
    }

    // STEP 5: Build system prompt (marketing-focused)
    const systemPrompt = buildMarketingSystemPrompt(
      session,
      searchResults,
      mergedIntent
    )

    // STEP 6: Generate response with Claude Sonnet 4.5
    const response = await generateMarketingResponse(message, session, systemPrompt)
    console.log('[dev-chat-engine] Generated response:', response.length, 'chars')

    // STEP 7: Generate follow-up suggestions
    const suggestions = generateDevSuggestions(searchResults, mergedIntent)

    // STEP 8: Update session with conversation history and intent
    await updateDevSession(session.session_id, message, response, extractedIntent)

    // STEP 9: Prepare sources for response
    // Increased to 15 to ensure all accommodations (8) reach the client
    const sources = searchResults.slice(0, 15).map((result) => ({
      table: result.table,
      id: result.id,
      name: result.name || result.title || 'Unknown',
      content: result.content.substring(0, 300),
      similarity: result.similarity,
      pricing: result.pricing,
      photos: result.photos,
    }))

    const totalTime = Date.now() - startTime
    console.log(`[dev-chat-engine] ✅ Response generated in ${totalTime}ms`)

    return {
      session_id: session.session_id,
      response,
      sources,
      travel_intent: {
        check_in: mergedIntent.check_in,
        check_out: mergedIntent.check_out,
        guests: mergedIntent.guests,
        accommodation_type: mergedIntent.accommodation_type,
        captured_this_message: intentCaptured,
      },
      suggestions,
    }
  } catch (error) {
    console.error('[dev-chat-engine] Error:', error)

    // Fallback response
    return {
      session_id: sessionId || 'error',
      response: '¡Hola! Disculpa, tuve un problema procesando tu mensaje. ¿Podrías intentarlo de nuevo? Estoy aquí para ayudarte a encontrar el alojamiento perfecto para tu estadía.',
      sources: [],
      travel_intent: {
        check_in: null,
        check_out: null,
        guests: null,
        accommodation_type: null,
        captured_this_message: false,
      },
      suggestions: [
        '¿Qué apartamentos tienen disponibles?',
        '¿Cuáles son los precios?',
        '¿Dónde están ubicados?',
      ],
    }
  }
}

// ============================================================================
// System Prompt Builder
// ============================================================================

/**
 * Build marketing-focused system prompt with search context
 */
function buildMarketingSystemPrompt(
  session: DevSession,
  searchResults: VectorSearchResult[],
  travelIntent: DevSession['travel_intent']
): string {
  // Build search context
  // Increased to 15 to provide Claude with all accommodations context
  const searchContext = searchResults
    .slice(0, 15)
    .map((result, index) => {
      const name = result.name || result.title || 'Unknown'
      const pricing = result.pricing
        ? `\nPrecio: ${result.pricing.base_price_night} ${result.pricing.currency}/noche`
        : ''
      const preview = result.content.substring(0, 400)

      return `[${index + 1}] ${name} (similaridad: ${result.similarity.toFixed(2)})${pricing}\n${preview}...`
    })
    .join('\n\n---\n\n')

  // Build intent context
  const intentSummary = travelIntent.check_in
    ? `\nINTENT CAPTURADO:
- Check-in: ${travelIntent.check_in || 'No especificado'}
- Check-out: ${travelIntent.check_out || 'No especificado'}
- Huéspedes: ${travelIntent.guests || 'No especificado'}
- Tipo: ${travelIntent.accommodation_type || 'No especificado'}
`
    : ''

  return `Eres un asistente virtual de ventas para un hotel en San Andrés, Colombia. Tu objetivo es ayudar a visitantes del sitio web a encontrar alojamiento perfecto y convertirlos en reservas.

🎯 OBJETIVO: Conversión de visitante a reserva

ESTILO DE COMUNICACIÓN:
- Amigable, profesional, entusiasta
- Marketing-focused (destaca beneficios y características únicas)
- Usa emojis ocasionalmente para ambiente tropical (🌴, 🌊, ☀️)
- Respuestas concisas pero informativas (4-6 oraciones máximo)
- Incluye CTAs (calls-to-action) cuando sea apropiado

INFORMACIÓN DISPONIBLE:
- Catálogo COMPLETO de alojamientos (con precios y fotos)
- Políticas del hotel (check-in, check-out, cancelación)
- Información básica de turismo en San Andrés (atracciones)

RESTRICCIONES:
- NO tengas acceso a información operacional interna
- NO puedes ver disponibilidad en tiempo real (dirígelos al sistema de reservas)
- NO des información de otros hoteles/competidores
- SIEMPRE menciona precios cuando estén disponibles

${intentSummary}

RESULTADOS DE BÚSQUEDA:
${searchContext || 'No se encontraron resultados relevantes.'}

INSTRUCCIONES:
1. Si identificas fechas/huéspedes, confirma y ofrece opciones relevantes
2. Destaca características únicas (vista al mar, cocina completa, ubicación, etc.)
3. Incluye precios cuando estén disponibles
4. Si preguntan sobre turismo, da información básica y luego vuelve a alojamientos
5. Siempre termina con pregunta o CTA para continuar conversación

Responde de manera natural, útil y orientada a conversión.`
}

// ============================================================================
// Response Generation
// ============================================================================

/**
 * Generate marketing response using Claude Sonnet 4.5
 */
async function generateMarketingResponse(
  message: string,
  session: DevSession,
  systemPrompt: string
): Promise<string> {
  const client = getAnthropicClient()

  // Build conversation history for Claude
  const conversationHistory = session.conversation_history
    .slice(-5) // Last 5 messages
    .map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929', // Latest Sonnet 4.5 for marketing quality
      max_tokens: 600,
      temperature: 0.3, // Slightly creative for marketing
      top_k: 10,
      system: systemPrompt,
      messages: [
        ...conversationHistory,
        {
          role: 'user',
          content: message,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Invalid response type from Claude')
    }

    return content.text
  } catch (error) {
    console.error('[dev-chat-engine] Claude error:', error)

    // Fallback response with search results
    return '¡Hola! Tenemos opciones increíbles para tu estadía. ¿Podrías contarme más sobre qué tipo de alojamiento buscas y para cuántas personas? Así puedo mostrarte las mejores opciones disponibles.'
  }
}

// ============================================================================
// Suggestion Generation
// ============================================================================

/**
 * Generate contextual follow-up suggestions
 */
function generateDevSuggestions(
  searchResults: VectorSearchResult[],
  travelIntent: DevSession['travel_intent']
): string[] {
  const suggestions: string[] = []

  // Strategy 1: Intent-based suggestions
  if (!travelIntent.check_in) {
    suggestions.push('¿Qué fechas tienen disponibles?')
  }

  if (!travelIntent.guests) {
    suggestions.push('¿Para cuántas personas?')
  }

  if (travelIntent.check_in && !searchResults.some((r) => r.table === 'accommodation_units_public')) {
    suggestions.push('Ver fotos de los apartamentos')
  }

  // Strategy 2: Result-based suggestions
  const hasAccommodations = searchResults.some((r) => r.table === 'accommodation_units_public')
  const hasPolicies = searchResults.some((r) => r.table === 'policies')
  const hasMuva = searchResults.some((r) => r.table === 'muva_content')

  if (hasAccommodations) {
    suggestions.push('Comparar precios de todas las opciones')
    suggestions.push('¿Tienen cocina completa?')
  }

  if (hasMuva && !hasAccommodations) {
    suggestions.push('Volver a opciones de alojamiento')
  }

  if (hasPolicies) {
    suggestions.push('¿Cuál es la política de cancelación?')
  }

  // Strategy 3: Generic helpful suggestions
  if (suggestions.length < 3) {
    suggestions.push('¿Qué incluye el precio?')
    suggestions.push('¿Cuál tiene la mejor vista al mar?')
    suggestions.push('¿Qué hay cerca del hotel?')
  }

  // Return top 3 unique suggestions
  return Array.from(new Set(suggestions)).slice(0, 3)
}
