// MUVA Tourism Chat API Route
// Handles tourism-related questions for San Andrés and Colombian destinations
// Uses separate embeddings table and specialized search functions

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { searchMuvaContent, searchByMetadata, isMuvaQuestion, formatMuvaResponse, type MuvaSearchOptions } from '@/lib/muva-utils'

// Re-enable Edge Runtime for performance with robust error handling
export const runtime = 'edge'

// Removed pre-computed responses to ensure fair treatment of all businesses
// All responses now dynamically use available listings from the database

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
    "jugos de frutas", "bebidas tropicales", "smoothie bowl",
    "bali smoothies", "horarios", "donde encontrar", "ubicado",
    "ubicación bali", "horarios bali", "donde esta bali"
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

// Enhanced cache system for maximum performance
const muvaCache = new Map<string, { data: unknown, expires: number }>()
const embeddingCache = new Map<string, { embedding: number[], expires: number }>()
const pendingRequests = new Map<string, Promise<any>>()

// Context cache for pre-processed search results by category
const contextCache = new Map<string, {
  context: string,
  results: any[],
  expires: number
}>()

// EXPANDED: Top 20 popular queries for aggressive cache warm-up
const POPULAR_QUERIES = [
  "mejores restaurantes de san andrés",
  "actividades de buceo",
  "playas para snorkeling",
  "vida nocturna san andrés",
  "hoteles económicos",
  "transporte en la isla",
  "donde comprar souvenirs",
  "mejores playas",
  "restaurantes de mariscos",
  "tours en catamarán",
  "buceo en san andrés",
  "mejores hoteles",
  "comida típica",
  "actividades acuáticas",
  "johnny cay tour",
  "bares y discotecas",
  "alquiler de motos",
  "playa spratt bight",
  "restaurantes económicos",
  "smoothies bali"
]

// Warm-up cache with popular queries (run once every hour)
let lastWarmupTime = 0
const WARMUP_INTERVAL = 3600000 // 1 hour

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

// Enhanced cache helpers with context caching
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

// Context cache for pre-processed search results
function getContextCache(cacheKey: string) {
  const cached = contextCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached
  }
  if (cached) {
    contextCache.delete(cacheKey) // Clean expired
  }
  return null
}

function setContextCache(cacheKey: string, context: string, results: any[], ttlSeconds: number = 7200) {
  contextCache.set(cacheKey, {
    context,
    results,
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

function setEmbeddingCache(question: string, embedding: number[], ttlSeconds: number = 86400) {
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

// INTELLIGENT tourism fallback - connects ANY question to San Andrés tourism
function generateIntelligentTourismFallback(question: string): string {
  const lowerQuestion = question.toLowerCase()

  // Food/cooking related - connect to local cuisine and restaurants
  if (lowerQuestion.includes('caf') || lowerQuestion.includes('cocinar') || lowerQuestion.includes('receta') ||
      lowerQuestion.includes('café') || lowerQuestion.includes('bebida') || lowerQuestion.includes('preparar')) {
    return `☕ **Café y Bebidas en San Andrés**

En San Andrés puedes disfrutar del mejor café y bebidas locales:

🥤 **Bali Smoothies**: Especialistas en smoothies, cafés y bebidas saludables
🍹 **Bebidas Tropicales**: Coco loco, jugos naturales, cócteles caribeños
☕ **Café Local**: Encuentra café colombiano en restaurantes como El Totumasso
🌴 **Experiencia Única**: Prueba el agua de coco fresca directo del árbol

¿Te interesa algún tipo de bebida en particular?`
  }

  // Technology/work - connect to digital nomad spots and wifi
  if (lowerQuestion.includes('internet') || lowerQuestion.includes('wifi') || lowerQuestion.includes('trabajo') ||
      lowerQuestion.includes('computador') || lowerQuestion.includes('tecnolog')) {
    return `💻 **Trabajar y Conectarse en San Andrés**

Para nómadas digitales y visitantes que necesitan conectividad:

📶 **WiFi Confiable**: Bali Smoothies y restaurantes del centro tienen buena conexión
🏨 **Hoteles con Internet**: La mayoría de hoteles modernos ofrecen WiFi gratuito
☕ **Espacios de Trabajo**: Restaurantes como El Totumasso son ideales para trabajar
🌴 **Work & Beach**: Combina trabajo remoto con las mejores playas del Caribe

¿Necesitas recomendaciones específicas para trabajar desde la isla?`
  }

  // Health/sports - connect to water sports and activities
  if (lowerQuestion.includes('ejercicio') || lowerQuestion.includes('deporte') || lowerQuestion.includes('salud') ||
      lowerQuestion.includes('fitness') || lowerQuestion.includes('entrenar')) {
    return `🏃‍♂️ **Actividades y Deportes en San Andrés**

Mantente activo durante tu visita:

🏊‍♂️ **Deportes Acuáticos**: Buceo, snorkeling, kayak, parasailing
🏃‍♀️ **Actividades al Aire Libre**: Caminatas por la isla, yoga en la playa
🤿 **Centros de Buceo**: Blue Life Dive, Hans Dive Shop para aventuras submarinas
🏖️ **Playas Deportivas**: West View y Johnny Cay para actividades acuáticas

¿Qué tipo de actividad física te interesa más?`
  }

  // Shopping/products - connect to local shopping
  if (lowerQuestion.includes('comprar') || lowerQuestion.includes('producto') || lowerQuestion.includes('tienda') ||
      lowerQuestion.includes('precio') || lowerQuestion.includes('vender')) {
    return `🛍️ **Compras en San Andrés**

Encuentra productos únicos en la isla:

🏖️ **Duty Free**: Aprovecha los precios libres de impuestos
🎨 **Artesanías Locales**: Souvenirs típicos del Caribe colombiano
👕 **Ropa y Accesorios**: Encuentra desde ropa playera hasta marcas internacionales
🥥 **Productos Locales**: Aceite de coco, dulces típicos, café colombiano

¿Buscas algo específico para llevar de recuerdo?`
  }

  // Weather/time - connect to best time to visit
  if (lowerQuestion.includes('clima') || lowerQuestion.includes('tiempo') || lowerQuestion.includes('hora') ||
      lowerQuestion.includes('día') || lowerQuestion.includes('fecha')) {
    return `🌤️ **Clima y Mejor Época en San Andrés**

Información para planificar tu visita:

☀️ **Clima Tropical**: Temperatura promedio 27°C todo el año
🌧️ **Temporada Seca**: Diciembre a abril (mejor época)
🌊 **Temporada de Lluvias**: Mayo a noviembre (precios más bajos)
🕐 **Horarios**: Restaurantes abren desde las 7:30 AM hasta las 10 PM

¿Planeas viajar en alguna época específica?`
  }

  // Transportation/movement - connect to island transport
  if (lowerQuestion.includes('transporte') || lowerQuestion.includes('moverse') || lowerQuestion.includes('llegar') ||
      lowerQuestion.includes('viajar') || lowerQuestion.includes('mover')) {
    return `🚗 **Transporte en San Andrés**

Opciones para moverse por la isla:

🏍️ **Mototaxis**: La forma más popular y económica de transportarse
🚗 **Taxis**: Disponibles para trayectos más largos o con equipaje
🛵 **Alquiler de Motos**: Libertad total para explorar a tu ritmo
🚌 **Transporte Público**: Rutas limitadas pero económicas

¿Necesitas llegar a algún lugar específico?`
  }

  // General fallback - comprehensive tourism overview
  return `🏝️ **Bienvenido a San Andrés - Asistente MUVA**

Tu consulta puede estar relacionada con estas opciones turísticas:

🍽️ **Gastronomía**: Restaurantes, cafés, especialidades locales
🏖️ **Playas**: Actividades acuáticas, snorkeling, relajación
🏨 **Alojamiento**: Hoteles, posadas, todas las categorías
🎯 **Actividades**: Aventura, cultura, vida nocturna
🛍️ **Compras**: Duty free, artesanías, productos locales
🚗 **Logística**: Transporte, horarios, precios

**¿Cómo puedo ayudarte específicamente con tu experiencia en San Andrés?**`
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

// Warm-up cache with popular queries for instant responses
async function warmUpCache() {
  const now = Date.now()

  // Only warm up once per hour
  if (now - lastWarmupTime < WARMUP_INTERVAL) {
    return
  }

  console.log('[MUVA] 🔥 Starting cache warm-up for popular queries...')
  lastWarmupTime = now

  // AGGRESSIVE: Pre-generate embeddings for top 10 queries in parallel
  const warmupPromises = POPULAR_QUERIES.slice(0, 10).map(async (query) => {
    try {
      // Check if embedding already cached
      const cachedEmbedding = getEmbeddingCache(query)
      if (!cachedEmbedding) {
        console.log(`[MUVA] 🔥 Pre-generating embedding for: "${query}"`)
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-large',
          input: query,
          dimensions: 3072
        })
        setEmbeddingCache(query, embeddingResponse.data[0].embedding, 86400)
        console.log(`[MUVA] ✅ Cached embedding for: "${query}"`)
      }
    } catch (error) {
      console.warn(`[MUVA] ⚠️ Failed to warm up embedding for "${query}":`, error)
    }
  })

  // Execute all warm-up requests in parallel
  await Promise.allSettled(warmupPromises)

  console.log('[MUVA] ✅ Cache warm-up completed')
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

  // Background warm-up for popular queries (non-blocking)
  warmUpCache().catch(error => console.warn('[MUVA] Warm-up failed:', error))

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

    // PRIORITY 1: Check semantic cache only (no hardcoded responses)
    // All responses will be dynamically generated from actual database listings

    // Check semantic cache for previously generated responses
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

    // PARALLEL PROCESSING: Start embedding and potential metadata search simultaneously
    const embeddingStart = Date.now()
    let queryEmbedding: number[]
    let embeddingTime: number
    let embeddingCacheHit = false

    // Check embedding cache first
    const cachedEmbedding = getEmbeddingCache(question)

    const embeddingPromise = cachedEmbedding
      ? Promise.resolve(cachedEmbedding)
      : getOrCreateRequest(`embedding_${hashMuvaQuestion(question)}`, async () => {
          const response = await openai.embeddings.create({
            model: 'text-embedding-3-large',
            input: question,
            dimensions: 3072
          })
          return response.data[0].embedding
        })

    // If we have cached embedding, start parallel tasks
    if (cachedEmbedding) {
      embeddingCacheHit = true
      queryEmbedding = cachedEmbedding
      embeddingTime = Date.now() - embeddingStart
      console.log(`[MUVA] ✅ Embedding cache hit - ${embeddingTime}ms`)
    } else {
      queryEmbedding = await embeddingPromise as number[]
      embeddingTime = Date.now() - embeddingStart
      setEmbeddingCache(question, queryEmbedding, 86400) // 24 hours cache
      console.log(`[MUVA] Embedding generated and cached in ${embeddingTime}ms`)
    }

    // Step 2: Optimized search with parallel fallback preparation
    const searchStart = Date.now()
    const searchOptions: MuvaSearchOptions = {
      category: category as any,
      location,
      city,
      min_rating,
      match_count: 2, // MAXIMUM speed optimization
      match_threshold: 0.7 // Tuned threshold
    }

    // Start vector search immediately after embedding is ready
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

    // If still no results, always provide intelligent tourism fallback
    if (searchResults.length === 0) {
      // ALWAYS assume tourism context - no more rejections
      // Generate intelligent fallback that connects any question to San Andrés tourism
      const fallbackAnswer = generateIntelligentTourismFallback(question)
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
          search_strategy: 'intelligent_tourism_fallback'
        }
      })
    }

    // Step 3: Generate response with Claude
    const claudeStart = Date.now()

    // Build ultra-optimized context - MAXIMUM SPEED: 2-3 results only
    const context = searchResults.slice(0, 2).map(result => {  // Max 2 results for ultra speed
      let contextStr = `**${result.title || 'Lugar'}**\n`

      // HYPER-SHORT descriptions - max 60 chars for speed
      if (result.description && result.description.length > 0) {
        const shortDesc = result.description.length > 60
          ? result.description.substring(0, 60) + '...'
          : result.description
        contextStr += `${shortDesc}\n`
      } else if (result.content) {
        // HYPER aggressive truncation for maximum speed
        const shortContent = result.content.length > 50
          ? result.content.substring(0, 50) + '...'
          : result.content
        contextStr += `${shortContent}\n`
      }

      // Only absolutely essential metadata
      const essentials = []
      if (result.location) essentials.push(`📍 ${result.location}`)
      if (result.rating && result.rating > 0) essentials.push(`⭐ ${result.rating}`)
      if (result.price_range) essentials.push(`💰 ${result.price_range}`)
      if (result.opening_hours) essentials.push(`🕒 ${result.opening_hours}`)

      if (essentials.length > 0) {
        contextStr += essentials.join(' | ') + '\n'
      }

      return contextStr
    }).join('\n---\n')

    // Log sources used for transparency
    const sourcesUsed = searchResults
      .map(r => r.source_file || r.title || 'Documento sin título')
      .filter((source, index, array) => array.indexOf(source) === index) // Remove duplicates

    console.log(`[MUVA] Fuentes de información utilizadas: ${sourcesUsed.join(', ')}`)

    // ULTRA-OPTIMIZED system prompt - assumes ALL questions are tourism-related
    const systemPrompt = `MUVA asistente turístico San Andrés. TODA pregunta es sobre turismo. Español, directo, máx 120 palabras.

FORMATO: ## 🏖️ [Cat]: • **Nombre**: Info breve

REGLA:
- Usa contexto dado + conocimiento turístico San Andrés
- Asume intención turística siempre
- Conecta cualquier tema con experiencia turística

Contexto: ${context}

P: ${question}

R:`

    // MAXIMUM SPEED: Use Haiku for virtually ALL queries
    // Sonnet ONLY for extremely complex multi-step analysis
    const isComplexQuery = (
      question.length > 150 &&
      (question.includes('análisis detallado') || question.includes('comparación completa') || question.includes('explicación exhaustiva'))
    )

    // ALWAYS use Haiku unless extremely complex (99%+ of queries)
    const modelToUse = isComplexQuery
      ? 'claude-3-5-sonnet-20241022'
      : 'claude-3-5-haiku-20241022'  // Default for 99%+ of queries

    // HYPER-AGGRESSIVE token limits for maximum speed
    const maxTokens = isComplexQuery ? 400 : 80  // EXTREME reduction: 150->80 for simple queries

    console.log(`[MUVA] Using ${modelToUse} for ${isComplexQuery ? 'complex' : 'simple'} query`)

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
    let fallbackAnswer = generateIntelligentTourismFallback(question)

    if (error instanceof Error) {
      if (error.message.includes('OpenAI') || error.message.includes('embedding')) {
        errorMessage = TOURIST_ERROR_MESSAGES.embedding_error
      } else if (error.message.includes('Anthropic') || error.message.includes('Claude')) {
        errorMessage = TOURIST_ERROR_MESSAGES.claude_error
        // Try to provide fallback instead of just error
        fallbackAnswer = generateIntelligentTourismFallback(question)
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