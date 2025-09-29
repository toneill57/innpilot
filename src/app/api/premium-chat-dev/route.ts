import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function generateEmbedding(text: string, dimensions: number = 1024): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
    dimensions: dimensions,
    encoding_format: 'float',
  })
  return response.data[0].embedding
}

// Keywords para determinar el tipo de búsqueda - versión dev con logging extra
const TOURISM_KEYWORDS = [
  'restaurante', 'playa', 'actividad', 'turismo', 'atracciones', 'cultura', 'eventos',
  'buceo', 'snorkel', 'cayo', 'excursión', 'comida', 'cena', 'almuerzo', 'cenar',
  'visitar', 'conocer', 'paseo', 'tour', 'lugares', 'sitios', 'cerca', 'alrededor'
]

const ACCOMMODATION_KEYWORDS = [
  'habitación', 'habitaciones', 'suite', 'apartamento', 'cuarto', 'acomodación',
  'vista', 'terraza', 'balcón', 'amenidades', 'servicios', 'cama', 'baño',
  'cocina', 'wifi', 'aire', 'capacidad', 'personas', 'huéspedes'
]

function determineSearchType(query: string): 'accommodation' | 'tourism' | 'both' {
  const lowerQuery = query.toLowerCase()

  const hasAccommodationKeywords = ACCOMMODATION_KEYWORDS.some(keyword =>
    lowerQuery.includes(keyword)
  )

  const hasTourismKeywords = TOURISM_KEYWORDS.some(keyword =>
    lowerQuery.includes(keyword)
  )

  console.log(`[Premium Chat DEV] Query analysis:`, {
    query: lowerQuery,
    hasAccommodationKeywords,
    hasTourismKeywords,
    matchedAccommodation: ACCOMMODATION_KEYWORDS.filter(k => lowerQuery.includes(k)),
    matchedTourism: TOURISM_KEYWORDS.filter(k => lowerQuery.includes(k))
  })

  if (hasAccommodationKeywords && hasTourismKeywords) {
    return 'both'
  } else if (hasAccommodationKeywords) {
    return 'accommodation'
  } else if (hasTourismKeywords) {
    return 'tourism'
  } else {
    return 'both' // Default to both for ambiguous queries
  }
}

function formatResponse(accommodationResults: any[], tourismResults: any[], query: string, searchType: string): string {
  let response = ""

  // Añadir indicador de desarrollo
  response += "🧪 **[DESARROLLO]** Respuesta generada desde endpoint experimental\n\n"

  if (accommodationResults.length > 0) {
    response += "🏨 **Información del Hotel:**\n\n"

    // Remove duplicates by name
    const uniqueAccommodation = accommodationResults.filter((result, index, self) =>
      index === self.findIndex(r => r.name === result.name)
    )

    // Logging extra para desarrollo
    console.log(`[Premium Chat DEV] Processing ${uniqueAccommodation.length} unique accommodation results`)

    uniqueAccommodation.forEach((result, index) => {
      if (result.content || result.name) {
        response += `**${result.name}** (Dev Score: ${result.similarity?.toFixed(3) || 'N/A'})\n`
        if (result.view_type) {
          response += `📍 Vista: ${result.view_type}\n`
        }
        if (result.content) {
          // Clean and format content
          let cleanContent = result.content
            .replace(/^Apartamento: [^.]+\.\s*/, '') // Remove apartment prefix
            .replace(/&nbsp;/g, ' ') // Replace HTML entities
            .replace(/&amp;/g, '&')
            .replace(/\r\n/g, '\n') // Normalize line breaks
            .replace(/\r/g, '\n')
            .replace(/\n\s*\n/g, '\n') // Remove extra blank lines
            .trim()
          response += `${cleanContent}\n`
        }
        if (result.tourism_features) {
          response += `✨ ${result.tourism_features}\n`
        }
        if (result.booking_policies) {
          response += `📋 Políticas: ${result.booking_policies}\n`
        }
        response += "\n"
      }
    })
  }

  if (tourismResults.length > 0) {
    if (response.length > 0) {
      response += "\n---\n\n"
    }
    response += "🌴 **Información Turística San Andrés:**\n\n"

    // Remove duplicates by content
    const uniqueTourism = tourismResults.filter((result, index, self) =>
      index === self.findIndex(r => r.content === result.content)
    )

    console.log(`[Premium Chat DEV] Processing ${uniqueTourism.length} unique tourism results`)

    uniqueTourism.forEach((result, index) => {
      if (result.content) {
        // Clean and format tourism content with dev info
        const cleanContent = result.content.trim()
        response += `${cleanContent} (Dev Score: ${result.similarity?.toFixed(3) || 'N/A'})\n\n`
      }
    })
  }

  if (response.length === 0) {
    response = "🧪 **[DEV]** Lo siento, no encontré información específica sobre tu consulta. ¿Podrías ser más específico sobre qué aspecto del hotel o turismo en San Andrés te interesa?"
  }

  // Añadir metadata de desarrollo
  response += `\n\n---\n🔧 **Dev Info**: Query type: ${searchType}, Accommodation results: ${accommodationResults.length}, Tourism results: ${tourismResults.length}`

  return response.trim()
}

export async function POST(request: NextRequest) {
  try {
    const { query, client_id, business_name } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    console.log(`[Premium Chat DEV] 🧪 Query: "${query}" for client: ${business_name}`)

    const startTime = Date.now()
    const searchType = determineSearchType(query)

    console.log(`[Premium Chat DEV] Search type determined: ${searchType}`)

    // Generate embeddings for both systems with dev logging
    console.log(`[Premium Chat DEV] Generating embeddings...`)
    const embeddingStartTime = Date.now()

    const queryEmbeddingFast = await generateEmbedding(query, 1024) // For accommodation units
    const queryEmbeddingFull = await generateEmbedding(query, 3072) // For MUVA tourism

    const embeddingTime = Date.now() - embeddingStartTime
    console.log(`[Premium Chat DEV] Embeddings generated in ${embeddingTime}ms`)

    let accommodationResults: any[] = []
    let tourismResults: any[] = []
    let tierUsed = "Tier 1 (Ultra-fast) [DEV]"

    // Search accommodation data if needed
    if (searchType === 'accommodation' || searchType === 'both') {
      console.log(`[Premium Chat DEV] 🏨 Searching accommodation units...`)
      const accommodationStartTime = Date.now()

      // Use SimmerDown tenant ID
      const tenant_id = 'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf'

      const { data: unitResults, error: unitError } = await supabase
        .rpc('match_accommodation_units_fast', {
          query_embedding: queryEmbeddingFast,
          similarity_threshold: 0.1,
          match_count: 3
        })

      const accommodationSearchTime = Date.now() - accommodationStartTime

      if (unitError) {
        console.error(`[Premium Chat DEV] Accommodation search error:`, unitError)
      } else {
        accommodationResults = unitResults || []
        console.log(`[Premium Chat DEV] Found ${accommodationResults.length} accommodation results in ${accommodationSearchTime}ms`)
        console.log(`[Premium Chat DEV] Accommodation results preview:`, accommodationResults.map(r => ({ name: r.name, similarity: r.similarity })))
      }
    }

    // Search tourism data if needed
    if (searchType === 'tourism' || searchType === 'both') {
      console.log(`[Premium Chat DEV] 🌴 Searching MUVA tourism data...`)
      const tourismStartTime = Date.now()

      const { data: muvaResults, error: muvaError } = await supabase
        .rpc('match_muva_documents', {
          query_embedding: queryEmbeddingFull,
          match_threshold: 0.1,
          match_count: 3
        })

      const tourismSearchTime = Date.now() - tourismStartTime

      if (muvaError) {
        console.error(`[Premium Chat DEV] Tourism search error:`, muvaError)
      } else {
        tourismResults = muvaResults || []
        console.log(`[Premium Chat DEV] Found ${tourismResults.length} tourism results in ${tourismSearchTime}ms`)
        console.log(`[Premium Chat DEV] Tourism results preview:`, tourismResults.map(r => ({ source: r.source_file, similarity: r.similarity })))
      }
    }

    const totalTime = Date.now() - startTime

    // Format response for natural conversation
    const response = formatResponse(accommodationResults, tourismResults, query, searchType)

    // Prepare sources for frontend display
    const sources = [
      ...accommodationResults.map(result => ({
        type: 'accommodation' as const,
        name: result.name || 'Accommodation Unit',
        similarity: result.similarity || 0
      })),
      ...tourismResults.map(result => ({
        type: 'tourism' as const,
        name: result.source_file || 'Tourism Info',
        similarity: result.similarity || 0
      }))
    ]

    console.log(`[Premium Chat DEV] 🎯 Response generated in ${totalTime}ms`)
    console.log(`[Premium Chat DEV] Performance breakdown:`, {
      embedding_generation_ms: embeddingTime,
      vector_search_ms: totalTime - embeddingTime,
      total_ms: totalTime,
      results_count: accommodationResults.length + tourismResults.length
    })

    return NextResponse.json({
      success: true,
      response,
      sources,
      search_type: searchType,
      tier_info: {
        name: tierUsed,
        dimensions: 1024,
        search_duration_ms: totalTime
      },
      results_count: accommodationResults.length + tourismResults.length,
      performance: {
        embedding_generation_ms: embeddingTime,
        vector_search_ms: totalTime - embeddingTime,
        total_ms: totalTime
      },
      dev_info: {
        endpoint_version: "development",
        extra_logging: true,
        query_analysis: {
          detected_type: searchType,
          accommodation_keywords_found: ACCOMMODATION_KEYWORDS.filter(k => query.toLowerCase().includes(k)),
          tourism_keywords_found: TOURISM_KEYWORDS.filter(k => query.toLowerCase().includes(k))
        }
      }
    })

  } catch (error) {
    console.error('[Premium Chat DEV] 🚨 API Error:', error)
    return NextResponse.json({
      error: 'Internal server error (development)',
      details: error instanceof Error ? error.message : 'Unknown error',
      dev_info: {
        endpoint_version: "development",
        error_context: "This is the development endpoint - errors here don't affect production"
      }
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Premium Chat DEV API endpoint - Use POST method',
    description: '🧪 Development version of unified search across accommodation and tourism data',
    features: [
      'Multi-content search (hotel + tourism)',
      'Ultra-fast Vector Search (Tier 1)',
      'Natural conversation formatting',
      'Smart query type detection',
      'Performance optimized responses',
      'Extended development logging',
      'Similarity score display',
      'Query analysis breakdown'
    ],
    dev_info: {
      version: "development",
      purpose: "Testing and experimentation without affecting production",
      differences_from_prod: [
        "Extended logging and debugging info",
        "Similarity scores in responses",
        "Query analysis metadata",
        "Development indicators in UI",
        "Error context for debugging"
      ]
    }
  })
}