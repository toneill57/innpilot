// MUVA Tourism Utilities
// Separate domain logic for tourism content and recommendations

import { supabase } from './supabase'

export interface MuvaEmbedding {
  id: string
  content: string
  embedding?: number[]
  title?: string
  description?: string
  category: MuvaCategory
  location?: string
  city?: string
  coordinates?: [number, number] // [lat, lng]
  rating?: number
  price_range?: PriceRange
  source_file?: string
  chunk_index: number
  total_chunks: number
  opening_hours?: string
  contact_info?: ContactInfo
  tags?: string[]
  language: string
  created_at: string
  updated_at: string
  similarity?: number
  // Nueva metadata extendida
  amenities?: AmenitiesInfo
  business_hours_detailed?: BusinessHours
  pricing_detailed?: PricingDetails
  zone_info?: ZoneInfo
  search_terms?: string
  business_type_spanish?: string
  metadata_extra?: MetadataExtra
}

export type MuvaCategory =
  | 'restaurant' | 'attraction' | 'activity' | 'hotel'
  | 'transport' | 'shopping' | 'nightlife' | 'beach'
  | 'culture' | 'nature' | 'adventure' | 'guide'

export type PriceRange = '$' | '$$' | '$$$' | '$$$$'

export interface ContactInfo {
  phone?: string
  email?: string
  website?: string
  address?: string
  social_media?: {
    instagram?: string
    facebook?: string
    whatsapp?: string
  }
}

export interface AmenitiesInfo {
  pet_friendly?: boolean
  "420_friendly"?: boolean
  vegetarian_options?: boolean
  wheelchair_accessible?: boolean
  wifi_available?: boolean
  parking_available?: boolean
  english_speaking_staff?: boolean
  accepts_reservations?: boolean
}

export interface BusinessHours {
  schedule?: string
  days_closed?: string
}

export interface PricingDetails {
  range?: string
  currency?: string
  payment_methods?: string[]
  commission_info?: string
}

export interface ZoneInfo {
  zone?: string
  zone_description?: string
  subzone_description?: string
  zone_features?: string[]
}

export interface MetadataExtra {
  historical_significance?: string
  menu_info?: string
  last_menu_update?: string
  status?: string
  version?: string
  updated_at?: string
  created_at?: string
}

export interface MuvaSearchOptions {
  category?: MuvaCategory
  location?: string
  city?: string
  min_rating?: number
  price_range?: PriceRange
  match_count?: number
  match_threshold?: number
  // Nuevos filtros por amenities
  pet_friendly?: boolean
  "420_friendly"?: boolean
  vegetarian_options?: boolean
  wheelchair_accessible?: boolean
  wifi_available?: boolean
  english_speaking_staff?: boolean
  // Filtro por zona
  zone?: string
  business_type_spanish?: string
}

/**
 * Search MUVA tourism content using pgvector similarity
 */
export async function searchMuvaContent(
  queryEmbedding: number[],
  options: MuvaSearchOptions = {}
): Promise<MuvaEmbedding[]> {
  try {
    const {
      category,
      location,
      city,
      min_rating,
      match_count = 6,
      match_threshold = 0.3,
      // Nuevos filtros
      pet_friendly,
      "420_friendly": fourTwentyFriendly,
      vegetarian_options,
      wheelchair_accessible,
      wifi_available,
      english_speaking_staff,
      zone,
      business_type_spanish
    } = options

    console.log(`[MUVA] Searching with embedding length: ${queryEmbedding.length}`)
    console.log(`[MUVA] Filters - category: ${category}, location: ${location}, zone: ${zone}`)

    // Usar búsqueda extendida si hay filtros de amenities o zona
    const hasExtendedFilters = pet_friendly !== undefined ||
                              fourTwentyFriendly !== undefined ||
                              vegetarian_options !== undefined ||
                              wheelchair_accessible !== undefined ||
                              wifi_available !== undefined ||
                              english_speaking_staff !== undefined ||
                              zone || business_type_spanish

    if (hasExtendedFilters) {
      return searchMuvaContentExtended(queryEmbedding, options)
    }

    // Búsqueda tradicional para compatibilidad
    const { data, error } = await supabase.rpc('match_muva_documents', {
      query_embedding: queryEmbedding,
      match_threshold,
      match_count,
      filter_category: category,
      filter_location: location,
      filter_city: city,
      min_rating
    })

    if (error) {
      console.error('[MUVA] Vector search error:', error)
      throw new Error(`MUVA search failed: ${error.message}`)
    }

    if (!data || data.length === 0) {
      console.log('[MUVA] No results found for query')
      return []
    }

    console.log(`[MUVA] Found ${data.length} tourism results`)
    return data.map(formatMuvaResult)
  } catch (error) {
    console.error('[MUVA] Search error:', error)
    throw error
  }
}

/**
 * Extended search using new metadata columns
 */
async function searchMuvaContentExtended(
  queryEmbedding: number[],
  options: MuvaSearchOptions = {}
): Promise<MuvaEmbedding[]> {
  try {
    const {
      category,
      location,
      city,
      min_rating,
      match_count = 6,
      match_threshold = 0.3,
      pet_friendly,
      "420_friendly": fourTwentyFriendly,
      vegetarian_options,
      wheelchair_accessible,
      wifi_available,
      english_speaking_staff,
      zone,
      business_type_spanish
    } = options

    console.log(`[MUVA] Extended search with amenities filters`)

    // Construir query con filtros extendidos
    let query = supabase
      .from('muva_embeddings')
      .select(`
        id, content, title, description, category, location, city,
        coordinates, rating, price_range, source_file, chunk_index,
        total_chunks, opening_hours, contact_info, tags, language,
        created_at, updated_at, images, image_metadata,
        amenities, business_hours_detailed, pricing_detailed,
        zone_info, search_terms, business_type_spanish, metadata_extra
      `)

    // Aplicar filtros básicos
    if (category) {
      query = query.eq('category', category)
    }
    if (location) {
      query = query.eq('location', location)
    }
    if (city) {
      query = query.eq('city', city)
    }
    if (min_rating) {
      query = query.gte('rating', min_rating)
    }
    if (business_type_spanish) {
      query = query.eq('business_type_spanish', business_type_spanish)
    }

    // Filtros de zona usando JSONB
    if (zone) {
      query = query.eq('zone_info->zone', zone)
    }

    // Filtros de amenities usando JSONB
    if (pet_friendly !== undefined) {
      query = query.eq('amenities->pet_friendly', pet_friendly)
    }
    if (fourTwentyFriendly !== undefined) {
      query = query.eq('amenities->420_friendly', fourTwentyFriendly)
    }
    if (vegetarian_options !== undefined) {
      query = query.eq('amenities->vegetarian_options', vegetarian_options)
    }
    if (wheelchair_accessible !== undefined) {
      query = query.eq('amenities->wheelchair_accessible', wheelchair_accessible)
    }
    if (wifi_available !== undefined) {
      query = query.eq('amenities->wifi_available', wifi_available)
    }
    if (english_speaking_staff !== undefined) {
      query = query.eq('amenities->english_speaking_staff', english_speaking_staff)
    }

    query = query.limit(match_count)

    const { data, error } = await query

    if (error) {
      console.error('[MUVA] Extended search error:', error)
      throw new Error(`Extended MUVA search failed: ${error.message}`)
    }

    if (!data || data.length === 0) {
      console.log('[MUVA] No results found with extended filters')
      return []
    }

    console.log(`[MUVA] Found ${data.length} results with extended filters`)
    return data.map(formatMuvaResult)
  } catch (error) {
    console.error('[MUVA] Extended search error:', error)
    throw error
  }
}

/**
 * Search restaurants specifically
 */
export async function searchMuvaRestaurants(
  queryEmbedding: number[],
  location?: string,
  minRating?: number,
  priceRange?: PriceRange,
  matchCount = 4
): Promise<Partial<MuvaEmbedding>[]> {
  try {
    const { data, error } = await supabase.rpc('search_muva_restaurants', {
      query_embedding: queryEmbedding,
      location_filter: location,
      min_rating: minRating,
      price_filter: priceRange,
      match_count: matchCount
    })

    if (error) {
      console.error('[MUVA] Restaurant search error:', error)
      throw new Error(`Restaurant search failed: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('[MUVA] Restaurant search error:', error)
    throw error
  }
}

/**
 * Search attractions specifically
 */
export async function searchMuvaAttractions(
  queryEmbedding: number[],
  location?: string,
  minRating?: number,
  matchCount = 4
): Promise<Partial<MuvaEmbedding>[]> {
  try {
    const { data, error } = await supabase.rpc('search_muva_attractions', {
      query_embedding: queryEmbedding,
      location_filter: location,
      min_rating: minRating,
      match_count: matchCount
    })

    if (error) {
      console.error('[MUVA] Attraction search error:', error)
      throw new Error(`Attraction search failed: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('[MUVA] Attraction search error:', error)
    throw error
  }
}

/**
 * Format MUVA search result
 */
function formatMuvaResult(result: any): MuvaEmbedding {
  return {
    id: result.id,
    content: result.content,
    embedding: result.embedding,
    title: result.title,
    description: result.description,
    category: result.category,
    location: result.location,
    city: result.city,
    coordinates: result.coordinates ? [result.coordinates.x, result.coordinates.y] : undefined,
    rating: result.rating ? parseFloat(result.rating) : undefined,
    price_range: result.price_range,
    source_file: result.source_file,
    chunk_index: result.chunk_index,
    total_chunks: result.total_chunks,
    opening_hours: result.opening_hours,
    contact_info: result.contact_info,
    tags: result.tags,
    language: result.language || 'es',
    created_at: result.created_at,
    updated_at: result.updated_at,
    similarity: result.similarity,
    // Nueva metadata extendida
    amenities: result.amenities,
    business_hours_detailed: result.business_hours_detailed,
    pricing_detailed: result.pricing_detailed,
    zone_info: result.zone_info,
    search_terms: result.search_terms,
    business_type_spanish: result.business_type_spanish,
    metadata_extra: result.metadata_extra
  }
}

/**
 * Get categories for filtering
 */
export function getMuvaCategories(): { value: MuvaCategory; label: string }[] {
  return [
    { value: 'restaurant', label: 'Restaurantes' },
    { value: 'attraction', label: 'Atracciones' },
    { value: 'activity', label: 'Actividades' },
    { value: 'hotel', label: 'Hoteles' },
    { value: 'transport', label: 'Transporte' },
    { value: 'shopping', label: 'Compras' },
    { value: 'nightlife', label: 'Vida Nocturna' },
    { value: 'beach', label: 'Playas' },
    { value: 'culture', label: 'Cultura' },
    { value: 'nature', label: 'Naturaleza' },
    { value: 'adventure', label: 'Aventura' },
    { value: 'guide', label: 'Guías' }
  ]
}

/**
 * Get price ranges for filtering
 */
export function getPriceRanges(): { value: PriceRange; label: string }[] {
  return [
    { value: '$', label: 'Económico ($)' },
    { value: '$$', label: 'Moderado ($$)' },
    { value: '$$$', label: 'Costoso ($$$)' },
    { value: '$$$$', label: 'Muy Costoso ($$$$)' }
  ]
}

/**
 * Search by metadata when vectorial search doesn't return results
 */
export async function searchByMetadata(query: string, matchCount = 4): Promise<MuvaEmbedding[]> {
  try {
    console.log(`[MUVA] Searching by metadata for: "${query}"`)

    const lowerQuery = query.toLowerCase()

    // Build flexible search query for title, description, content, and tags
    const { data, error } = await supabase
      .from('muva_embeddings')
      .select('*')
      .or(`title.ilike.%${lowerQuery}%,description.ilike.%${lowerQuery}%,content.ilike.%${lowerQuery}%,tags.cs.{${lowerQuery}}`)
      .limit(matchCount)

    if (error) {
      console.error('[MUVA] Metadata search error:', error)
      throw new Error(`Metadata search failed: ${error.message}`)
    }

    if (!data || data.length === 0) {
      console.log('[MUVA] No metadata results found')
      return []
    }

    console.log(`[MUVA] Found ${data.length} metadata results`)
    return data.map(formatMuvaResult)
  } catch (error) {
    console.error('[MUVA] Metadata search error:', error)
    throw error
  }
}

/**
 * Check if question is MUVA-related
 */
export function isMuvaQuestion(question: string): boolean {
  const muvaKeywords = [
    'turismo', 'turista', 'visitar', 'conocer', 'turistico',
    'restaurante', 'comida', 'comer', 'cenar', 'almorzar',
    'playa', 'atraccion', 'actividad', 'paseo', 'excursion',
    'hotel', 'hospedaje', 'alojamiento', 'dormir',
    'comprar', 'shopping', 'tienda', 'mercado',
    'cultura', 'museo', 'historia', 'arte',
    'naturaleza', 'parque', 'aventura', 'buceo',
    'vida nocturna', 'bar', 'discoteca', 'fiesta',
    'transporte', 'llegar', 'mover', 'taxi', 'bus',
    'san andres', 'providencia', 'colombia', 'caribe',
    'recomendar', 'recomendacion', 'sugerir', 'mejor',
    'donde', 'que hacer', 'que visitar', 'plan',
    // Agregamos palabras específicas para casos problemáticos
    'smoothie', 'smoothies', 'pancake', 'pancakes', 'pet friendly',
    'mascotas', 'pets', 'animales', 'pet', 'friendly'
  ]

  const lowerQuestion = question.toLowerCase()
  return muvaKeywords.some(keyword => lowerQuestion.includes(keyword))
}

/**
 * Format MUVA response for better UX
 */
export function formatMuvaResponse(results: MuvaEmbedding[]): string {
  if (results.length === 0) {
    return "No encontré información específica sobre esa consulta turística. ¿Podrías ser más específico sobre lo que buscas en San Andrés?"
  }

  let response = "🏝️ **Información Turística de San Andrés:**\n\n"

  results.forEach((result) => {
    const emoji = getCategoryEmoji(result.category)
    response += `${emoji} **${result.title || 'Información'}**\n`

    if (result.description) {
      response += `${result.description}\n`
    } else if (result.content) {
      response += `${result.content.slice(0, 200)}...\n`
    }

    if (result.rating) {
      response += `⭐ Calificación: ${result.rating}/5\n`
    }

    if (result.price_range) {
      response += `💰 Precio: ${result.price_range}\n`
    }

    if (result.location) {
      response += `📍 Ubicación: ${result.location}\n`
    }

    if (result.opening_hours) {
      response += `🕒 Horarios: ${result.opening_hours}\n`
    }

    response += "\n"
  })

  return response
}

/**
 * Get emoji for category titles (not for bullet points)
 */
function getCategoryEmoji(category: MuvaCategory): string {
  const emojiMap: Record<MuvaCategory, string> = {
    restaurant: '🍽️',
    attraction: '🎯',
    activity: '🎪',
    hotel: '🏨',
    transport: '🚗',
    shopping: '🛍️',
    nightlife: '🌙',
    beach: '🏖️',
    culture: '🏛️',
    nature: '🌿',
    adventure: '⛰️',
    guide: '📖'
  }

  return emojiMap[category] || '📍'
}