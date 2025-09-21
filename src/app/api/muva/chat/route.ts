// MUVA Tourism Chat API Route
// Handles tourism-related questions for San Andrés and Colombian destinations
// Uses separate embeddings table and specialized search functions

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { searchMuvaContent, searchByMetadata, isMuvaQuestion, formatMuvaResponse, type MuvaSearchOptions } from '@/lib/muva-utils'

export const runtime = 'edge'

// Enhanced semantic question groups for intelligent caching (MUVA tourism focus)
const MUVA_SEMANTIC_GROUPS = {
  "mejores_restaurantes": [
    "mejores restaurantes", "dónde comer", "restaurantes recomendados",
    "comida típica", "gastronomía local", "restaurantes de mariscos",
    "pescado fresco", "langosta", "cangrejo", "comida del mar",
    "almuerzo", "cena", "desayuno", "brunch", "comida caribeña"
  ],
  "restaurantes_economicos": [
    "restaurantes baratos", "comida económica", "presupuesto bajo",
    "restaurantes accesibles", "comida barata", "donde comer barato"
  ],
  "restaurantes_premium": [
    "restaurantes caros", "fine dining", "restaurantes elegantes",
    "cena romántica", "alta cocina", "restaurantes exclusivos"
  ],
  "bebidas_smoothies": [
    "smoothies", "jugos", "batidos", "bebidas naturales",
    "jugos de frutas", "bebidas tropicales", "smoothie bowl"
  ],
  "playas_principales": [
    "mejores playas", "playa principal", "spratt bight",
    "playa bonita", "arena blanca", "aguas cristalinas"
  ],
  "playas_snorkel": [
    "snorkeling", "buceo", "arrecife", "peces tropicales",
    "vida marina", "corales", "buceo libre", "máscara y snorkel"
  ],
  "actividades_acuaticas": [
    "actividades acuáticas", "deportes acuáticos", "jet ski",
    "kayak", "windsurf", "kitesurf", "parasailing", "banana boat"
  ],
  "excursiones_islas": [
    "johnny cay", "acuario", "tour de islas", "catamarán",
    "isla del acuario", "excursión", "paseo en lancha", "tour marítimo"
  ],
  "vida_nocturna": [
    "bares", "discotecas", "vida nocturna", "dónde salir de noche",
    "música en vivo", "entretenimiento nocturno", "rumba", "fiesta",
    "drinks", "cocktails", "reggae", "música caribeña"
  ],
  "transporte_general": [
    "cómo moverse", "transporte", "movilidad", "cómo llegar"
  ],
  "taxi_mototaxi": [
    "taxi", "mototaxi", "uber", "transporte privado", "carrera"
  ],
  "alquiler_vehiculos": [
    "alquiler de motos", "rental", "alquiler de carros",
    "scooter", "bicicleta", "vehículo"
  ],
  "buses_publico": [
    "buses", "transporte público", "colectivo", "ruta"
  ],
  "alojamiento_hoteles": [
    "hoteles", "dónde hospedarse", "alojamiento", "mejores hoteles",
    "resorts", "hotel con piscina", "hotel frente al mar"
  ],
  "alojamiento_economico": [
    "posadas", "hospedaje barato", "hotel económico",
    "backpacker", "alojamiento presupuesto", "casa de huéspedes"
  ],
  "alojamiento_lujo": [
    "resort de lujo", "hotel 5 estrellas", "hotel boutique",
    "spa hotel", "hotel premium", "suite presidencial"
  ],
  "compras_general": [
    "qué comprar", "shopping", "tiendas", "centros comerciales"
  ],
  "artesanias_souvenirs": [
    "artesanías", "souvenirs", "recuerdos", "productos locales",
    "artesanía local", "handicrafts", "regalos típicos"
  ],
  "mercados_locales": [
    "mercados", "mercado local", "productos frescos",
    "frutas tropicales", "verduras", "pescado fresco"
  ],
  "cultura_historia": [
    "cultura", "historia", "museo", "sitios históricos",
    "patrimonio", "tradiciones", "arquitectura colonial"
  ],
  "naturaleza_parques": [
    "naturaleza", "parques", "jardín botánico", "ecoturismo",
    "senderos", "observación de aves", "flora y fauna"
  ],
  "aventura_extrema": [
    "aventura", "deportes extremos", "parapente", "escalada",
    "rappel", "canopy", "adrenalina", "aventura extrema"
  ],
  "familia_ninos": [
    "actividades familiares", "para niños", "familia",
    "niños pequeños", "entretenimiento familiar", "diversión familiar"
  ],
  "clima_tiempo": [
    "clima", "tiempo", "lluvia", "temporada seca",
    "mejor época", "huracanes", "temperatura"
  ],
  "presupuesto_costos": [
    "cuánto cuesta", "precios", "presupuesto", "económico",
    "caro", "barato", "costos", "tarifas"
  ],
  "recomendaciones_generales": [
    "qué hacer", "recomendaciones", "plan de viaje",
    "itinerario", "primera vez", "imperdibles", "must do"
  ]
}

// Memory cache for MUVA responses (Edge Runtime compatible)
const muvaCache = new Map<string, { data: unknown, expires: number }>()

// Embedding cache to avoid repeated OpenAI API calls
const embeddingCache = new Map<string, { embedding: number[], expires: number }>()

// Request deduplication cache for simultaneous identical requests
const pendingRequests = new Map<string, Promise<any>>()

// Simple hash function for cache keys (Edge Runtime compatible)
function hashMuvaQuestion(question: string): string {
  const str = question.toLowerCase().trim()
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

// Enhanced semantic cache key generation for tourism
function getMuvaCacheKey(question: string): string {
  const normalizedQuestion = question.toLowerCase().trim()

  // Check if question matches any tourism semantic group
  for (const [groupKey, patterns] of Object.entries(MUVA_SEMANTIC_GROUPS)) {
    for (const pattern of patterns) {
      if (normalizedQuestion.includes(pattern)) {
        return `muva:semantic:${groupKey}`
      }
    }
  }

  // Fallback to exact match hash
  return `muva:exact:${hashMuvaQuestion(question)}`
}

// Memory cache helpers (Edge Runtime compatible)
function getMuvaCache(key: string) {
  const cached = muvaCache.get(key)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }
  if (cached) {
    muvaCache.delete(key) // Clean expired
  }
  return null
}

function setMuvaCache(key: string, data: unknown, ttlSeconds: number = 3600) {
  muvaCache.set(key, {
    data,
    expires: Date.now() + (ttlSeconds * 1000)
  })
}

// Embedding cache helpers
function getEmbeddingCache(question: string): number[] | null {
  const key = hashMuvaQuestion(question)
  const cached = embeddingCache.get(key)
  if (cached && cached.expires > Date.now()) {
    return cached.embedding
  }
  if (cached) {
    embeddingCache.delete(key) // Clean expired
  }
  return null
}

function setEmbeddingCache(question: string, embedding: number[], ttlSeconds: number = 7200) {
  const key = hashMuvaQuestion(question)
  embeddingCache.set(key, {
    embedding,
    expires: Date.now() + (ttlSeconds * 1000)
  })
}

// Request deduplication helpers
function getOrCreateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
  if (pendingRequests.has(key)) {
    console.log(`[MUVA] 🔄 Deduplicating request for key: ${key}`)
    return pendingRequests.get(key)!
  }

  const promise = requestFn().finally(() => {
    pendingRequests.delete(key)
  })

  pendingRequests.set(key, promise)
  return promise
}

// Tourism-specific error messages
const TOURIST_ERROR_MESSAGES = {
  'no_results': '🏝️ No encontré información específica sobre eso. ¿Te puedo ayudar con restaurantes, playas o actividades en San Andrés?',
  'service_error': '⚠️ Estoy teniendo problemas técnicos. Por favor intenta de nuevo en unos momentos.',
  'invalid_filters': '🔍 Los filtros seleccionados no son compatibles. Intenta con menos filtros específicos.',
  'embedding_error': '🤖 Error al procesar tu pregunta. ¿Podrías reformularla de manera más simple?',
  'claude_error': '💭 Error al generar la respuesta. Permíteme intentarlo de nuevo.',
  'general_fallback': '💭 Hay un problema temporal. Mientras tanto, ¿te puedo ayudar con información general sobre San Andrés?'
}

// Generate tourism fallback response
function generateTourismFallback(question: string): string {
  const lowerQuestion = question.toLowerCase()

  if (lowerQuestion.includes('restaurante') || lowerQuestion.includes('comer') || lowerQuestion.includes('comida')) {
    return `🍽️ **Restaurantes en San Andrés**

Aunque no pude encontrar información específica, te puedo recomendar:

🦞 **Mariscos**: **La Regatta**, **Donde Francesca**
🥥 **Comida Típica**: **Miss Celia**, **La Barracuda**
🍕 **Internacional**: **Hard Rock Cafe**, **Gourmet Shop Assorted**
🌅 **Con Vista al Mar**: **Captain Mandy's**, **Restaurante Donde Francesca**

¿Te interesa alguna categoría en particular?`
  }

  if (lowerQuestion.includes('playa') || lowerQuestion.includes('nadar') || lowerQuestion.includes('agua')) {
    return `🏖️ **Playas de San Andrés**

Las mejores opciones para disfrutar el mar:

🌊 **Spratt Bight**: Playa principal, perfecta para familias
🐠 **West View**: Ideal para snorkeling y buceo
🏄 **Sound Bay**: Más tranquila, excelente para relajarse
⭐ **Johnny Cay**: Excursión imperdible en catamarán

¿Qué tipo de actividad acuática te interesa más?`
  }

  if (lowerQuestion.includes('hotel') || lowerQuestion.includes('hospedaje') || lowerQuestion.includes('alojamiento')) {
    return `🏨 **Alojamiento en San Andrés**

Opciones recomendadas por zona:

🌟 **Zona Norte**: **Hotel Casa Harb**, **GHL Relax Hotel**
🏖️ **Frente al Mar**: **Decameron**, **Hotel Tiuna**
💰 **Económicos**: **Posada Doña Rosa**, **Hotel Arena Blanca**
• **Boutique**: **Casa Verde Hotel**, **Hotel Portofino**

¿Qué presupuesto y zona prefieres?`
  }

  return `🏝️ **San Andrés te espera**

No encontré información específica, pero puedo ayudarte con:

🍽️ **Restaurantes y gastronomía local**
🏖️ **Playas y actividades acuáticas**
🏨 **Hoteles y alojamiento**
🌙 **Vida nocturna y entretenimiento**
🛍️ **Compras y mercados**
🚗 **Transporte y movilidad**

¿Sobre qué te gustaría saber más?`
}

// Robust input validation for MUVA
function validateMuvaInput(input: MuvaChatRequest): { isValid: boolean; error?: string } {
  // Check question length
  if (!input.question || input.question.trim().length === 0) {
    return { isValid: false, error: 'La pregunta es requerida' }
  }

  if (input.question.length > 500) {
    return { isValid: false, error: `Pregunta muy larga (máximo 500 caracteres, actual: ${input.question.length})` }
  }

  if (input.question.trim().length < 3) {
    return { isValid: false, error: 'La pregunta debe tener al menos 3 caracteres' }
  }

  // Validate filter combinations
  if (input.category === 'beach' && input.price_range) {
    return { isValid: false, error: 'Las playas no tienen rango de precio' }
  }

  if (input.category === 'nature' && input.price_range) {
    return { isValid: false, error: 'Los lugares naturales no tienen rango de precio' }
  }

  // Validate rating range
  if (input.min_rating && (input.min_rating < 1 || input.min_rating > 5)) {
    return { isValid: false, error: 'La calificación mínima debe estar entre 1 y 5' }
  }

  // Basic spam detection
  if (detectSpamPattern(input.question)) {
    return { isValid: false, error: 'Pregunta no válida detectada' }
  }

  return { isValid: true }
}

// Simple spam detection patterns
function detectSpamPattern(question: string): boolean {
  const spamPatterns = [
    /(.)\1{4,}/i, // Repeated characters (aaaaa, 11111)
    /^.{1,3}$/i, // Too short after trim
    /\b(viagra|casino|lottery|winner|congratulations)\b/i, // Common spam words
    /[!@#$%^&*]{5,}/i, // Too many special characters
    /\b(http|www|\.com|\.net)\b/i, // URLs (not typical for tourism questions)
  ]

  return spamPatterns.some(pattern => pattern.test(question))
}

// Calculate relevance score for search results
function calculateRelevanceScore(results: any[]): number {
  if (results.length === 0) return 0

  const similarities = results.map(r => r.similarity || 0)
  const avgSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length

  // Score based on average similarity and result count
  const countBonus = Math.min(results.length / 5, 1) // Bonus for having good number of results
  return Math.round((avgSimilarity * 0.8 + countBonus * 0.2) * 100) / 100
}

// Get semantic group for analytics
function getMuvaSemanticGroup(question: string): string | null {
  const normalizedQuestion = question.toLowerCase().trim()

  for (const [groupKey, patterns] of Object.entries(MUVA_SEMANTIC_GROUPS)) {
    for (const pattern of patterns) {
      if (normalizedQuestion.includes(pattern)) {
        return groupKey
      }
    }
  }

  return null
}

// Enhanced performance tracking for analytics
async function trackMuvaMetrics(metrics: {
  endpoint: string
  response_time: number
  cache_hit: boolean
  embedding_cache_hit?: boolean
  category?: string
  filters_used: number
  results_found: number
  question_length: number
  semantic_group?: string | null
  question: string
  session_id: string
  location?: string
  city?: string
  result_quality?: number
  context_chunks_used?: number
  context_size_chars?: number
  model_used?: string
  embedding_time?: number
  search_time?: number
  claude_time?: number
}) {
  try {
    // Enhanced analytics tracking with performance breakdown
    const performanceData = {
      query: metrics.question.substring(0, 50),
      category: metrics.category,
      total_response_time: metrics.response_time,
      cache_hit: metrics.cache_hit,
      embedding_cache_hit: metrics.embedding_cache_hit || false,
      results_found: metrics.results_found,
      semantic_group: metrics.semantic_group,
      performance_breakdown: {
        embedding_time: metrics.embedding_time || 0,
        search_time: metrics.search_time || 0,
        claude_time: metrics.claude_time || 0,
        context_size_chars: metrics.context_size_chars || 0,
        model_used: metrics.model_used || 'unknown'
      },
      optimization_impact: {
        embedding_saved: metrics.embedding_cache_hit ? metrics.embedding_time || 0 : 0,
        cache_category: metrics.cache_hit ? 'semantic_cache' : 'no_cache'
      }
    }

    console.log(`[MUVA Metrics] 📊 Enhanced Analytics:`, performanceData)

    // Log performance alerts for slow queries
    if (metrics.response_time > 2000) {
      console.warn(`[MUVA Performance] ⚠️ Slow query detected: ${metrics.response_time}ms`, {
        question: metrics.question.substring(0, 30),
        embedding_time: metrics.embedding_time,
        search_time: metrics.search_time,
        claude_time: metrics.claude_time,
        results_found: metrics.results_found
      })
    }

    // Log optimization wins
    if (metrics.embedding_cache_hit) {
      console.log(`[MUVA Optimization] ✅ Embedding cache saved ~${metrics.embedding_time}ms`)
    }

    if (metrics.cache_hit) {
      console.log(`[MUVA Optimization] ✅ Semantic cache hit - instant response`)
    }

  } catch (error) {
    console.error(`[MUVA Metrics] ❌ Failed to track analytics:`, error)
  }
}

// Performance monitoring helper
function logPerformanceBreakdown(timings: {
  total: number
  embedding: number
  search: number
  claude: number
  embeddingCacheHit: boolean
  responseCacheHit: boolean
}) {
  const breakdown = [
    `Total: ${timings.total}ms`,
    `Embedding: ${timings.embedding}ms ${timings.embeddingCacheHit ? '(cached)' : ''}`,
    `Search: ${timings.search}ms`,
    `Claude: ${timings.claude}ms`,
    `Cache: ${timings.responseCacheHit ? 'semantic hit' : 'miss'}`
  ].join(' | ')

  if (timings.total < 500) {
    console.log(`[MUVA Performance] 🚀 Fast response: ${breakdown}`)
  } else if (timings.total < 1500) {
    console.log(`[MUVA Performance] ⚡ Good response: ${breakdown}`)
  } else {
    console.warn(`[MUVA Performance] 🐌 Slow response: ${breakdown}`)
  }
}

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
  const sessionId = request.headers.get('x-session-id') || `session_${Date.now()}_${Math.random().toString(36).substring(2)}`

  let question = '' // Declare question outside try block for catch scope access

  try {
    const requestData: MuvaChatRequest = await request.json()
    const { category, location, city, min_rating, price_range } = requestData
    question = requestData.question // Assign question value

    // Robust input validation
    const validation = validateMuvaInput(requestData)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          message: validation.error,
          answer: TOURIST_ERROR_MESSAGES.invalid_filters
        },
        { status: 400 }
      )
    }

    console.log(`[MUVA] Processing tourism question: "${question}"`)
    console.log(`[MUVA] Filters - category: ${category}, location: ${location}`)

    // Check cache first (using semantic grouping)
    const cacheKey = getMuvaCacheKey(question)
    const cached = getMuvaCache(cacheKey)
    if (cached) {
      const responseTime = Date.now() - startTime
      console.log(`[MUVA] ✅ Semantic cache hit - Response time: ${responseTime}ms`)

      // Add performance metrics to cached response
      const cachedWithMetrics = {
        ...cached,
        performance: {
          ...((cached as { performance?: Record<string, unknown> }).performance || {}),
          total_time_ms: responseTime,
          cache_hit: true
        }
      }

      return NextResponse.json(cachedWithMetrics)
    }

    // Step 1: Generate or retrieve embedding for the question
    const embeddingStart = Date.now()
    let queryEmbedding: number[]
    let embeddingTime: number
    let embeddingCacheHit = false

    // Check embedding cache first
    const cachedEmbedding = getEmbeddingCache(question)
    if (cachedEmbedding) {
      queryEmbedding = cachedEmbedding
      embeddingTime = Date.now() - embeddingStart
      embeddingCacheHit = true
      console.log(`[MUVA] ✅ Embedding cache hit - ${embeddingTime}ms`)
    } else {
      // Use request deduplication for embedding generation
      const embeddingKey = `embedding_${hashMuvaQuestion(question)}`
      const embeddingResponse = await getOrCreateRequest(embeddingKey, async () => {
        return await openai.embeddings.create({
          model: 'text-embedding-3-large',
          input: question,
          dimensions: 3072
        })
      })

      queryEmbedding = embeddingResponse.data[0].embedding
      embeddingTime = Date.now() - embeddingStart

      // Cache the embedding for future use
      setEmbeddingCache(question, queryEmbedding, 7200) // 2 hours cache
      console.log(`[MUVA] Embedding generated and cached in ${embeddingTime}ms`)
    }

    // Step 2: Hierarchical search - vectorial first, then metadata
    const searchStart = Date.now()
    const searchOptions: MuvaSearchOptions = {
      category: category as any,
      location,
      city,
      min_rating,
      match_count: 6,
      match_threshold: 0.25 // Slightly lower threshold for tourism content
    }

    let searchResults = await searchMuvaContent(queryEmbedding, searchOptions)
    let searchStrategy = 'vector_search'

    console.log(`[MUVA] Vector search completed in ${Date.now() - searchStart}ms, found ${searchResults.length} results`)

    // If no results from vectorial search, try metadata search
    if (searchResults.length === 0) {
      console.log(`[MUVA] No vector results, trying metadata search...`)
      searchResults = await searchByMetadata(question, 4)
      searchStrategy = 'metadata_search'
      console.log(`[MUVA] Metadata search found ${searchResults.length} results`)
    }

    const searchTime = Date.now() - searchStart

    // If still no results, check if it's tourism-related for fallback
    if (searchResults.length === 0) {
      // Only now we validate if it's a tourism question for fallback
      if (!isMuvaQuestion(question)) {
        return NextResponse.json({
          answer: "Esta pregunta parece ser sobre temas no turísticos. El Asistente MUVA está especializado en información turística de San Andrés y destinos colombianos. ¿Te puedo ayudar con recomendaciones de restaurantes, atracciones, actividades o información de viaje?",
          context_used: false,
          context_count: 0,
          performance: {
            total_time_ms: Date.now() - startTime,
            embedding_time_ms: embeddingTime,
            search_time_ms: searchTime,
            claude_time_ms: 0
          },
          metadata: {
            results_found: 0,
            search_strategy: 'non_tourism_question'
          }
        })
      }

      const fallbackAnswer = generateTourismFallback(question)
      return NextResponse.json({
        answer: fallbackAnswer,
        context_used: false,
        context_count: 0,
        performance: {
          total_time_ms: Date.now() - startTime,
          embedding_time_ms: embeddingTime,
          search_time_ms: searchTime,
          claude_time_ms: 0,
          cache_hit: false
        },
        metadata: {
          category_filter: category,
          location_filter: location,
          results_found: 0,
          search_strategy: 'fallback_response'
        }
      })
    }

    // Step 3: Generate response with Claude
    const claudeStart = Date.now()

    // Build optimized context from search results - only essential data
    const context = searchResults.map(result => {
      let contextStr = `**${result.title || 'Información Turística'}**\n`

      // Use description if available, otherwise truncate content
      if (result.description) {
        contextStr += `${result.description}\n`
      } else if (result.content) {
        // Truncate content to 200 chars to reduce context size
        const truncatedContent = result.content.length > 200
          ? result.content.substring(0, 200) + '...'
          : result.content
        contextStr += `${truncatedContent}\n`
      }

      // Only include essential metadata that affects recommendations
      const essentialData = []

      if (result.category) essentialData.push(`Categoría: ${result.category}`)
      if (result.location) essentialData.push(`Ubicación: ${result.location}`)
      if (result.rating) essentialData.push(`⭐ ${result.rating}/5`)
      if (result.price_range) essentialData.push(`💰 ${result.price_range}`)
      if (result.opening_hours) essentialData.push(`🕒 ${result.opening_hours}`)

      // Simplified contact info - only phone and address
      if (result.contact_info) {
        if (result.contact_info.phone) essentialData.push(`📞 ${result.contact_info.phone}`)
        if (result.contact_info.address) essentialData.push(`📍 ${result.contact_info.address}`)
      }

      if (essentialData.length > 0) {
        contextStr += essentialData.join(' | ') + '\n'
      }

      return contextStr
    }).join('\n---\n')

    // Log sources used for transparency
    const sourcesUsed = searchResults
      .map(r => r.source_file || r.title || 'Documento sin título')
      .filter((source, index, array) => array.indexOf(source) === index) // Remove duplicates

    console.log(`[MUVA] Fuentes de información utilizadas: ${sourcesUsed.join(', ')}`)

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
3. Usa emojis SOLAMENTE para títulos de sección H2 (## 🍽️ Restaurantes y Gastronomía:), pero NUNCA uses emojis como bullet points en las listas. SIEMPRE usa bullet points normales (•) para listas, NO emojis de palmeras (🌴) ni otros emojis como viñetas
4. Proporciona información práctica y específica
5. Si mencionas lugares, incluye detalles como ubicación, horarios, precios cuando estén disponibles
6. Organiza la información de manera clara y fácil de leer
7. **RESTRICCIÓN CRÍTICA: SOLO usa información del contexto turístico proporcionado. NUNCA inventes, asumas o agregues información que no esté explícitamente en los datos de la base de datos. Si no tienes información específica sobre algo, di claramente que no está disponible en tu base de datos.**
8. Siempre enfócate en el aspecto turístico y de experiencia del viajero
9. IMPORTANTE: Siempre que menciones nombres de negocios, restaurantes, hoteles, lugares específicos o atracciones, ponlos en **negritas** para destacarlos visualmente (ej: **Bali Smoothies**, **Hotel Casa Harb**, **Johnny Cay**)
10. CRÍTICO: Para todas las listas, usa EXCLUSIVAMENTE bullet points normales (• o -). NO uses ningún emoji como viñeta, especialmente NO uses 🌴, 🏖️, 🍽️ o cualquier otro emoji como bullet point
11. FORMATO CRÍTICO DE SECCIONES Y LISTAS:

**TÍTULOS DE SECCIÓN**: Usa formato H2 (##) seguido de dos puntos y SALTO DE LÍNEA obligatorio:

## 🏖️ Playas Perfectas para Familias:

• **Playa Spratt Bight**: Arena suave, aguas tranquilas, ideal para niños pequeños
• **Rocky Cay**: Perfecta para snorkel familiar, muy poco profunda
• **Playa Honda**: Tranquila, con zona de juegos y restaurantes cercanos

## 🎯 Tours Familiares Imperdibles:

• **Johnny Cay**: Tour de medio día con snorkel, picnic y diversión en una pequeña isla
• **Tour de los 7 Colores**: Paseo en lancha donde los niños pueden ver diferentes tonalidades del mar
• **Acuario San Andrés**: Exhibiciones educativas de vida marina local

12. REGLAS OBLIGATORIAS PARA FORMATO:
- NUNCA pongas listas en la misma línea que el título
- SIEMPRE usa salto de línea después de títulos con dos puntos ":"
- CADA establecimiento debe ir en línea separada con viñeta "•"
- Usa formato: • **Nombre**: Descripción completa
- NO uses guiones (-), SOLO viñetas (•)

13. FORMATO ESPECÍFICO PARA LUGARES:
NUNCA uses H3 para lugares específicos. SIEMPRE mantenlos como elementos de lista bajo categorías H2:

## 🎯 Actividades Familiares:

• **Johnny Cay**: Tour de medio día perfecto para familias. Pequeña isla con playas cristalinas, ideal para snorkel con niños, incluye picnic y tiempo de playa
• **Acuario San Andrés**: Experiencia educativa y divertida. Exhibiciones de vida marina local, actividades interactivas para niños, entrada económica, horario 9:00 am - 5:00 pm

14. REGLA CRÍTICA: NUNCA uses guiones (-) en listas. SIEMPRE usa viñetas (•)

15. REGLA CRÍTICA: NUNCA hagas listas inline (en la misma línea). SIEMPRE formato vertical:

❌ INCORRECTO (NUNCA HAGAS ESTO):
• Senderos fáciles para caminar • Especies locales de plantas • Ideal para aprender sobre ecosistema
• Arena suave • Aguas tranquilas • Ideal para niños pequeños • Servicios cercanos

✅ CORRECTO (SIEMPRE HAZ ESTO):
• Senderos fáciles para caminar
• Especies locales de plantas
• Ideal para aprender sobre ecosistema isleño
• Entrada económica

• Arena suave
• Aguas tranquilas
• Ideal para niños pequeños
• Servicios cercanos

16. FORMATO DE MARKDOWN LIMPIO:
- NUNCA dejes asteriscos expuestos: **texto incompleto
- SIEMPRE completa el markdown: **texto completo**
- NUNCA dejes hashtags expuestos: ### en medio del texto

15. DIFERENCIA DE FORMATO:
- Lugares específicos: • **Nombre**: Descripción (viñeta azul)
- Consejos/tips: • Texto del consejo (emoji dinámico)

Contexto turístico disponible:
${context}

Pregunta del usuario: ${question}`

    // Use faster model for simple queries, Sonnet for complex ones
    const isSimpleQuery = searchResults.length <= 2 || question.length < 50
    const modelToUse = isSimpleQuery
      ? 'claude-3-5-haiku-20241022'  // Faster for simple queries
      : (process.env.CLAUDE_MUVA_MODEL || 'claude-3-5-sonnet-20241022')

    const maxTokens = isSimpleQuery ? 800 : parseInt(process.env.CLAUDE_MUVA_MAX_TOKENS || '1200')

    console.log(`[MUVA] Using ${modelToUse} for ${isSimpleQuery ? 'simple' : 'complex'} query`)

    const claudeResponse = await anthropic.messages.create({
      model: modelToUse,
      max_tokens: maxTokens,
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

    // Log detailed performance breakdown
    logPerformanceBreakdown({
      total: totalTime,
      embedding: embeddingTime,
      search: searchTime,
      claude: claudeTime,
      embeddingCacheHit,
      responseCacheHit: false
    })

    const answer = claudeResponse.content[0].type === 'text'
      ? claudeResponse.content[0].text
      : 'Error al generar respuesta'

    const result = {
      answer,
      context_used: true,
      context_count: searchResults.length,
      performance: {
        total_time_ms: totalTime,
        embedding_time_ms: embeddingTime,
        search_time_ms: searchTime,
        claude_time_ms: claudeTime,
        cache_hit: false,
        embedding_cache_hit: embeddingCacheHit,
        model_used: modelToUse,
        context_size_chars: context.length,
        filters_applied: Object.keys({ category, location, city, min_rating, price_range }).filter(key =>
          (key === 'category' && category) ||
          (key === 'location' && location) ||
          (key === 'city' && city) ||
          (key === 'min_rating' && min_rating) ||
          (key === 'price_range' && price_range)
        ).length,
        result_quality: calculateRelevanceScore(searchResults),
        question_length: question.length,
        semantic_group: getMuvaSemanticGroup(question)
      },
      metadata: {
        category_filter: category,
        location_filter: location,
        city_filter: city,
        min_rating_filter: min_rating,
        price_range_filter: price_range,
        results_found: searchResults.length,
        search_strategy: searchStrategy + '_with_context',
        avg_similarity: searchResults.length > 0 ?
          searchResults.reduce((sum, r) => sum + (r.similarity || 0), 0) / searchResults.length : 0
      }
    }

    // Save to semantic cache (1 hour TTL)
    setMuvaCache(cacheKey, result, 3600)
    console.log(`[MUVA] 💾 Saved to semantic cache`)

    // Track enhanced metrics for analytics
    await trackMuvaMetrics({
      endpoint: 'muva_chat',
      response_time: totalTime,
      cache_hit: false,
      embedding_cache_hit: embeddingCacheHit,
      category,
      location,
      city,
      filters_used: result.performance.filters_applied,
      results_found: searchResults.length,
      question_length: question.length,
      semantic_group: result.performance.semantic_group,
      question,
      session_id: sessionId,
      result_quality: result.performance.result_quality,
      context_chunks_used: searchResults.length,
      context_size_chars: context.length,
      model_used: modelToUse,
      embedding_time: embeddingTime,
      search_time: searchTime,
      claude_time: claudeTime
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('[MUVA] Error processing tourism question:', error)

    // Determine error type and provide appropriate fallback
    let errorMessage = TOURIST_ERROR_MESSAGES.general_fallback
    let fallbackAnswer = generateTourismFallback(question)

    if (error instanceof Error) {
      if (error.message.includes('OpenAI') || error.message.includes('embedding')) {
        errorMessage = TOURIST_ERROR_MESSAGES.embedding_error
      } else if (error.message.includes('Anthropic') || error.message.includes('Claude')) {
        errorMessage = TOURIST_ERROR_MESSAGES.claude_error
        // Try to provide fallback instead of just error
        fallbackAnswer = generateTourismFallback(question)
      } else if (error.message.includes('Supabase') || error.message.includes('database')) {
        errorMessage = TOURIST_ERROR_MESSAGES.service_error
      }
    }

    return NextResponse.json({
      answer: fallbackAnswer,
      context_used: false,
      context_count: 0,
      performance: {
        total_time_ms: Date.now() - startTime,
        embedding_time_ms: 0,
        search_time_ms: 0,
        claude_time_ms: 0,
        cache_hit: false
      },
      metadata: {
        results_found: 0,
        search_strategy: 'error_fallback',
        error_type: error instanceof Error ? error.message : 'Unknown error',
        fallback_used: true
      }
    }, { status: 200 }) // Return 200 since we're providing fallback content
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