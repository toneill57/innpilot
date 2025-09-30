/**
 * Conversational Chat Engine
 *
 * Core engine for generating context-aware conversational responses
 * with entity tracking, query enhancement, and multi-source search.
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { enhanceQuery, type EnhancedQuery } from '@/lib/context-enhancer'
import type { GuestSession } from '@/lib/guest-auth'

// ============================================================================
// Configuration
// ============================================================================

// Lazy initialization for Supabase client (avoids test issues)
let supabase: any = null

function getSupabaseClient() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabase
}

// Lazy initialization to avoid issues in test environment
let openai: OpenAI | null = null
let anthropic: Anthropic | null = null

function getOpenAIClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    })
  }
  return openai
}

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

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  entities?: string[]
  created_at: string
}

export interface ConversationalContext {
  query: string
  history: ChatMessage[]
  guestInfo: GuestSession
  vectorResults: VectorSearchResult[]
}

export interface ConversationalResponse {
  response: string
  entities: string[]
  followUpSuggestions: string[]
  sources: SourceMetadata[]
  confidence: number
}

export interface VectorSearchResult {
  id?: string
  name?: string
  title?: string
  source_file?: string
  content: string
  description?: string
  similarity: number
  table: string
  business_info?: any
  view_type?: string
}

export interface SourceMetadata {
  type: 'accommodation' | 'tourism' | 'document'
  name: string
  similarity: number
  file?: string
}

interface DocumentContent {
  content: string
  metadata: any
}

// ============================================================================
// Main Engine Function
// ============================================================================

/**
 * Generate conversational response with full context awareness
 */
export async function generateConversationalResponse(
  context: ConversationalContext
): Promise<ConversationalResponse> {
  const startTime = Date.now()

  console.log(`[Chat Engine] Processing query: "${context.query.substring(0, 80)}..."`)

  try {
    // STEP 1: Extract entities from conversation history
    const historicalEntities = extractEntities(context.history)
    console.log(`[Chat Engine] Extracted ${historicalEntities.length} entities from history:`, historicalEntities)

    // STEP 2: Enhance query with context (using Claude Haiku)
    const enhancedQuery = await enhanceQuery(context.query, context.history)
    console.log(`[Chat Engine] Enhanced query: "${enhancedQuery.enhanced}" (isFollowUp: ${enhancedQuery.isFollowUp})`)

    // STEP 3: Perform context-aware vector search
    const vectorResults = await performContextAwareSearch(
      enhancedQuery.enhanced,
      [...historicalEntities, ...enhancedQuery.entities]
    )
    console.log(`[Chat Engine] Found ${vectorResults.length} vector results`)

    // STEP 4: Retrieve full documents for high-confidence results
    const enrichedResults = await enrichResultsWithFullDocuments(vectorResults)
    console.log(`[Chat Engine] Enriched ${enrichedResults.length} results with full documents`)

    // STEP 5: Generate response with Claude Sonnet 3.5
    const fullContext: ConversationalContext = {
      ...context,
      vectorResults: enrichedResults,
    }

    const response = await generateResponseWithClaude(fullContext, enhancedQuery)
    console.log(`[Chat Engine] Generated response (${response.length} chars)`)

    // STEP 6: Extract entities from current conversation
    const currentEntities = [...enhancedQuery.entities, ...historicalEntities]
    const uniqueEntities = Array.from(new Set(currentEntities))

    // STEP 7: Generate follow-up suggestions
    const followUpSuggestions = generateFollowUpSuggestions(response, uniqueEntities, vectorResults)

    // STEP 8: Prepare sources metadata
    const sources = vectorResults.slice(0, 5).map((result) => ({
      type: (result.table === 'accommodation_units' ? 'accommodation' : 'tourism') as const,
      name: result.name || result.title || result.source_file || 'Unknown',
      similarity: result.similarity,
      file: result.source_file,
    }))

    // STEP 9: Calculate confidence score
    const confidence = calculateConfidence(vectorResults, enhancedQuery)

    const totalTime = Date.now() - startTime
    console.log(`[Chat Engine] ✅ Response generated in ${totalTime}ms (confidence: ${confidence.toFixed(2)})`)

    return {
      response,
      entities: uniqueEntities,
      followUpSuggestions,
      sources,
      confidence,
    }
  } catch (error) {
    console.error('[Chat Engine] Error generating response:', error)

    // Fallback response
    return {
      response: 'Lo siento, tuve un problema procesando tu mensaje. ¿Podrías intentarlo de nuevo?',
      entities: [],
      followUpSuggestions: [
        '¿Qué actividades puedo hacer en San Andrés?',
        '¿Cuáles son las mejores playas?',
        '¿Dónde puedo bucear?',
      ],
      sources: [],
      confidence: 0.0,
    }
  }
}

// ============================================================================
// Entity Extraction
// ============================================================================

/**
 * Extract entities (places, activities) from conversation history
 */
export function extractEntities(history: ChatMessage[]): string[] {
  const entities: string[] = []

  // Extract entities from previous messages
  history.forEach((message) => {
    if (message.entities && message.entities.length > 0) {
      entities.push(...message.entities)
    }
  })

  // Deduplicate and return
  return Array.from(new Set(entities))
}

// ============================================================================
// Context-Aware Vector Search
// ============================================================================

/**
 * Perform vector search with entity boosting
 */
async function performContextAwareSearch(
  query: string,
  entities: string[]
): Promise<VectorSearchResult[]> {
  const startTime = Date.now()

  try {
    // Generate embeddings for enhanced query
    const [queryEmbeddingFast, queryEmbeddingFull] = await Promise.all([
      generateEmbedding(query, 1024), // Tier 1 for accommodation
      generateEmbedding(query, 3072), // Tier 3 for tourism
    ])

    console.log(`[Chat Engine] Generated embeddings in ${Date.now() - startTime}ms`)

    // Perform parallel searches
    const [accommodationResults, tourismResults] = await Promise.all([
      searchAccommodation(queryEmbeddingFast),
      searchTourism(queryEmbeddingFull),
    ])

    console.log(`[Chat Engine] Vector search completed in ${Date.now() - startTime}ms`)

    // Combine and boost results that match entities
    const allResults = [...accommodationResults, ...tourismResults]

    // Boost similarity scores for results matching conversation entities
    if (entities.length > 0) {
      allResults.forEach((result) => {
        const resultText = [
          result.name,
          result.title,
          result.source_file,
          result.content?.substring(0, 200),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        entities.forEach((entity) => {
          if (resultText.includes(entity.toLowerCase())) {
            result.similarity += 0.1 // Boost score by 10%
            console.log(`[Chat Engine] Boosted result "${result.name || result.source_file}" (entity: ${entity})`)
          }
        })
      })
    }

    // Sort by similarity (descending)
    allResults.sort((a, b) => b.similarity - a.similarity)

    return allResults.slice(0, 10) // Top 10 results
  } catch (error) {
    console.error('[Chat Engine] Vector search error:', error)
    return []
  }
}

/**
 * Generate OpenAI embedding
 */
async function generateEmbedding(text: string, dimensions: number): Promise<number[]> {
  const client = getOpenAIClient()
  const response = await client.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
    dimensions: dimensions,
    encoding_format: 'float',
  })
  return response.data[0].embedding
}

/**
 * Search accommodation units
 */
async function searchAccommodation(embedding: number[]): Promise<VectorSearchResult[]> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc('match_accommodation_units_fast', {
    query_embedding: embedding,
    similarity_threshold: 0.15,
    match_count: 5,
  })

  if (error) {
    console.error('[Chat Engine] Accommodation search error:', error)
    return []
  }

  return (data || []).map((item: any) => ({
    ...item,
    table: 'accommodation_units',
  }))
}

/**
 * Search MUVA tourism content
 */
async function searchTourism(embedding: number[]): Promise<VectorSearchResult[]> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc('match_muva_documents', {
    query_embedding: embedding,
    match_threshold: 0.15,
    match_count: 5,
  })

  if (error) {
    console.error('[Chat Engine] Tourism search error:', error)
    return []
  }

  return (data || []).map((item: any) => ({
    ...item,
    table: 'muva_content',
  }))
}

// ============================================================================
// Full Document Retrieval
// ============================================================================

/**
 * Retrieve full documents for high-confidence results
 */
async function enrichResultsWithFullDocuments(
  results: VectorSearchResult[]
): Promise<VectorSearchResult[]> {
  const enrichedResults = await Promise.all(
    results.map(async (result) => {
      // Only retrieve full document if confidence > 0.7
      if (result.similarity > 0.7 && result.source_file && result.table === 'muva_content') {
        console.log(`[Chat Engine] Retrieving full document for ${result.source_file}`)

        const fullDoc = await retrieveFullDocument(result.source_file, result.table)

        if (fullDoc) {
          return {
            ...result,
            content: fullDoc.content,
            // Preserve existing metadata but add full document data
          }
        }
      }

      return result
    })
  )

  return enrichedResults
}

/**
 * Retrieve complete document content
 */
async function retrieveFullDocument(sourceFile: string, table: string): Promise<DocumentContent | null> {
  try {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from(table)
      .select('content, title, description, business_info, metadata')
      .eq('source_file', sourceFile)
      .single()

    if (error) {
      console.error('[Chat Engine] Error retrieving full document:', error)
      return null
    }

    return {
      content: data.content || '',
      metadata: {
        title: data.title,
        description: data.description,
        business_info: data.business_info,
        ...data.metadata,
      },
    }
  } catch (error) {
    console.error('[Chat Engine] retrieveFullDocument error:', error)
    return null
  }
}

// ============================================================================
// Claude Sonnet Response Generation
// ============================================================================

/**
 * Generate natural language response using Claude Sonnet 3.5
 */
async function generateResponseWithClaude(
  context: ConversationalContext,
  enhancedQuery: EnhancedQuery
): Promise<string> {
  const startTime = Date.now()

  try {
    // Build conversation history for Claude
    const conversationHistory = context.history
      .slice(-5) // Last 5 messages for context
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

    // Prepare search results context
    const searchContext = context.vectorResults
      .slice(0, 5) // Top 5 results
      .map((result, index) => {
        const name = result.name || result.title || result.source_file || 'Unknown'
        const preview = result.content.substring(0, 500)
        const businessInfo = result.business_info
          ? `\nContacto: ${result.business_info.telefono || 'N/A'}, Precio: ${result.business_info.precio || 'N/A'}`
          : ''

        return `[${index + 1}] ${name} (similaridad: ${result.similarity.toFixed(2)})${businessInfo}\n${preview}...`
      })
      .join('\n\n---\n\n')

    // System prompt
    const systemPrompt = `Eres un asistente virtual para huéspedes de hoteles en San Andrés, Colombia.

CONTEXTO DEL HUÉSPED:
- Nombre: ${context.guestInfo.guest_name}
- Check-in: ${context.guestInfo.check_in.toLocaleDateString('es-CO')}
- Check-out: ${context.guestInfo.check_out.toLocaleDateString('es-CO')}

INSTRUCCIONES:
1. Responde en español de manera conversacional y amigable
2. Usa SOLO la información proporcionada en los resultados de búsqueda
3. Si los resultados no contienen información relevante, indícalo claramente
4. Incluye detalles concretos (precios, ubicaciones, contactos) cuando estén disponibles
5. Personaliza la respuesta usando el nombre del huésped cuando sea apropiado
6. Si es una pregunta de seguimiento, conecta con el contexto previo de la conversación
7. Sé conciso pero informativo (máximo 300 palabras)
8. Usa emojis ocasionalmente para hacer la respuesta más amigable 🏝️

RESULTADOS DE BÚSQUEDA:
${searchContext || 'No se encontraron resultados relevantes.'}

Responde a la pregunta del huésped de manera natural y útil.`

    // Call Claude Sonnet 3.5
    const client = getAnthropicClient()
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022', // Claude Sonnet 3.5 (latest)
      max_tokens: 800,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        ...conversationHistory,
        {
          role: 'user',
          content: context.query,
        },
      ],
    })

    const duration = Date.now() - startTime
    console.log(`[Chat Engine] Claude Sonnet response generated in ${duration}ms`)

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Invalid response type from Claude')
    }

    return content.text
  } catch (error) {
    console.error('[Chat Engine] Claude generation error:', error)

    // Fallback: Basic response with search results
    if (context.vectorResults.length > 0) {
      const topResult = context.vectorResults[0]
      const name = topResult.name || topResult.title || 'esta opción'
      return `Hola ${context.guestInfo.guest_name}, encontré información sobre ${name}. ${topResult.content.substring(0, 200)}...`
    }

    return 'Lo siento, no encontré información específica sobre tu consulta. ¿Podrías reformular tu pregunta?'
  }
}

// ============================================================================
// Follow-up Suggestions
// ============================================================================

/**
 * Generate contextual follow-up suggestions
 */
export function generateFollowUpSuggestions(
  response: string,
  entities: string[],
  vectorResults: VectorSearchResult[]
): string[] {
  const suggestions: string[] = []

  // Strategy 1: Suggest related entities
  if (entities.length > 0) {
    const lastEntity = entities[entities.length - 1]
    suggestions.push(`¿Qué más puedo hacer cerca de ${lastEntity}?`)
  }

  // Strategy 2: Suggest based on result types
  const hasAccommodation = vectorResults.some((r) => r.table === 'accommodation_units')
  const hasTourism = vectorResults.some((r) => r.table === 'muva_content')

  if (hasTourism && !hasAccommodation) {
    suggestions.push('¿Cómo llego hasta allá desde mi hotel?')
    suggestions.push('¿Cuál es el horario de atención?')
  }

  if (hasAccommodation && !hasTourism) {
    suggestions.push('¿Qué actividades puedo hacer cerca?')
    suggestions.push('¿Hay restaurantes recomendados cerca?')
  }

  // Strategy 3: Generic helpful suggestions
  if (suggestions.length < 3) {
    suggestions.push('¿Cuáles son las mejores playas?')
    suggestions.push('¿Dónde puedo bucear?')
    suggestions.push('¿Qué restaurantes recomiendas?')
  }

  // Return top 3 unique suggestions
  return Array.from(new Set(suggestions)).slice(0, 3)
}

// ============================================================================
// Confidence Calculation
// ============================================================================

/**
 * Calculate confidence score for the response
 */
function calculateConfidence(results: VectorSearchResult[], enhancedQuery: EnhancedQuery): number {
  if (results.length === 0) {
    return 0.1
  }

  const topSimilarity = results[0].similarity
  const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length

  // Factors:
  // - Top result similarity (50%)
  // - Average similarity (25%)
  // - Query enhancement confidence (25%)
  const confidence = topSimilarity * 0.5 + avgSimilarity * 0.25 + enhancedQuery.confidence * 0.25

  return Math.min(Math.max(confidence, 0), 1) // Clamp to [0, 1]
}
