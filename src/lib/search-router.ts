// MATRYOSHKA SEARCH ROUTER - KEYWORD-BASED TIER SELECTION
// Automatically determines optimal search tier based on user query

export interface SearchStrategy {
  tier: 1 | 2 | 3
  dimensions: 1024 | 1536 | 3072
  tables: string[]
  description: string
}

// SEARCH STRATEGY CONFIGURATION - UPDATED FOR ACCOMMODATION SYSTEM
const SEARCH_PATTERNS = {
  // 🏠 ACCOMMODATION SYSTEM PATTERNS (Tier 1: Ultra Fast - Complete hotel data)
  accommodation_queries: {
    keywords: ['habitación', 'habitaciones', 'suite', 'suites', 'apartamento', 'apartamentos', 'cuarto', 'cuartos', 'acomodación', 'acomodaciones', 'unidad', 'unidades', 'alojamiento', 'alojamientos', 'tipos', 'tipo', 'qué tienen', 'disponible', 'disponibles', 'dreamland', 'mystic', 'kaya', 'vista', 'balcón', 'sunshine', 'one love', 'simmer highs'],
    tier: 1 as const,
    dimensions: 1024 as const,
    tables: ['accommodation_units', 'unit_amenities', 'properties', 'client_info', 'policies'],
    description: 'Consultas completas sobre acomodaciones y tipos de alojamiento'
  },

  hotel_queries: {
    keywords: ['hotel', 'propiedad', 'propiedades', 'lobby', 'recepción', 'amenidades del hotel', 'piscina', 'gimnasio', 'parking', 'wifi', 'negocio', 'empresa', 'información', 'contacto'],
    tier: 1 as const,
    dimensions: 1024 as const,
    tables: ['properties', 'client_info', 'content', 'guest_information'],
    description: 'Consultas sobre información del hotel y propiedades'
  },

  view_amenities_queries: {
    keywords: ['vista al mar', 'vista océano', 'vista jardín', 'aire acondicionado', 'cocina', 'tv', 'wifi', 'cuna', 'lavandería'],
    tier: 1 as const,
    dimensions: 1024 as const,
    tables: ['accommodation_units', 'unit_amenities'],
    description: 'Consultas sobre vistas y amenidades específicas'
  },

  // 🏛️ LEGACY PATTERNS (mantenemos compatibilidad)
  room_queries: {
    keywords: ['habitación', 'habitaciones', 'cuarto', 'cuartos', 'apartamento', 'apartamentos', 'cama', 'camas', 'baño', 'baños', 'dormitorio', 'dormitorios', 'acomodación', 'acomodaciones'],
    tier: 1 as const,
    dimensions: 1024 as const,
    tables: ['accommodation_units'],
    description: 'Consultas sobre habitaciones y acomodaciones (legacy)'
  },

  policy_queries: {
    keywords: ['regla', 'política', 'permitido', 'prohibido', 'horario', 'norma', 'reglamento', 'habibi'],
    tier: 1 as const,
    dimensions: 1024 as const,
    tables: ['policies'],
    description: 'Consultas sobre políticas y reglas de casa'
  },

  tourism_queries: {
    keywords: ['restaurante', 'playa', 'actividad', 'turismo', 'atracciones', 'cultura', 'eventos'],
    tier: 1 as const,
    dimensions: 1024 as const,
    tables: ['muva_content'],
    description: 'Consultas sobre turismo y atracciones'
  },

  // 🏨 BOOKING & POLICIES PATTERNS (Tier 2: Balanced - Policies focused)
  booking_queries: {
    keywords: ['reserva', 'disponibilidad', 'check-in', 'check-out', 'cancelación', 'modificación', 'confirmar'],
    tier: 2 as const,
    dimensions: 1536 as const,
    tables: ['bookings', 'accommodation_units'],
    description: 'Consultas sobre reservas y disponibilidad'
  },

  pricing_queries: {
    keywords: ['precio', 'precios', 'costo', 'costos', 'tarifa', 'tarifas', 'temporada alta', 'temporada baja', 'early check-in', 'late check-out', 'cuánto cuesta', 'cuánto vale', 'temporadas'],
    tier: 2 as const,
    dimensions: 1536 as const,
    tables: ['pricing_rules', 'accommodation_units', 'content'],
    description: 'Consultas sobre precios, tarifas y reglas de temporada'
  },

  policies_detailed: {
    keywords: ['política de', 'políticas', 'reglas de', 'reglas', 'restricciones', 'condiciones', 'términos', 'procedimiento', 'procedimientos', 'normas', 'check-in', 'check-out'],
    tier: 2 as const,
    dimensions: 1536 as const,
    tables: ['policies', 'guest_information', 'properties', 'content'],
    description: 'Consultas detalladas sobre políticas, reglas y procedimientos del hotel'
  },

  // 🏛️ LEGACY TIER 2 PATTERNS
  complex_queries: {
    keywords: ['proceso', 'procedimiento', 'información', 'documentación', 'instrucciones', 'guía', 'simmer', 'highs'],
    tier: 2 as const,
    dimensions: 1536 as const,
    tables: ['guest_information', 'content', 'sire_content'],
    description: 'Consultas complejas sobre procesos y documentación'
  },

  sire_queries: {
    keywords: ['sire', 'registro', 'extranjeros', 'migración', 'documentos', 'compliance'],
    tier: 2 as const,
    dimensions: 1536 as const,
    tables: ['sire_content'],
    description: 'Consultas sobre documentación SIRE'
  },

  // 🔍 DETAILED ANALYSIS PATTERNS (Tier 3: Full Precision - Complex analysis)
  detailed_accommodation: {
    keywords: ['comparar unidades', 'análisis detallado', 'especificaciones completas', 'diferencias entre'],
    tier: 3 as const,
    dimensions: 3072 as const,
    tables: ['accommodation_units', 'unit_amenities', 'pricing_rules', 'hotels'],
    description: 'Análisis detallado y comparativo de acomodaciones'
  },

  business_intelligence: {
    keywords: ['tendencias', 'análisis', 'reportes', 'estadísticas', 'ocupación', 'revenue'],
    tier: 3 as const,
    dimensions: 3072 as const,
    tables: ['bookings', 'pricing_rules', 'accommodation_units', 'hotels'],
    description: 'Consultas de business intelligence y análisis'
  },

  // 🏛️ LEGACY TIER 3 PATTERNS
  specific_queries: {
    keywords: ['precio', 'costo', 'tarifa', 'amenidad específica', 'detalles técnicos'],
    tier: 3 as const,
    dimensions: 3072 as const,
    tables: ['client_info', 'properties', 'unit_amenities', 'pricing_rules'],
    description: 'Consultas específicas que requieren máxima precisión (legacy)'
  }
}

/**
 * Determina la estrategia de búsqueda óptima basada en el query del usuario
 */
export function determineOptimalSearch(userQuery: string): SearchStrategy {
  if (!userQuery || typeof userQuery !== 'string') {
    return getDefaultStrategy()
  }

  const query = userQuery.toLowerCase().trim()

  // Analizar keywords para determinar tier óptimo
  for (const [patternName, pattern] of Object.entries(SEARCH_PATTERNS)) {
    const hasKeyword = pattern.keywords.some(keyword =>
      query.includes(keyword.toLowerCase())
    )

    if (hasKeyword) {
      console.log(`🎯 Search strategy: ${patternName} (Tier ${pattern.tier}) - ${pattern.description}`)
      return {
        tier: pattern.tier,
        dimensions: pattern.dimensions,
        tables: pattern.tables,
        description: pattern.description
      }
    }
  }

  // Fallback basado en complejidad del query
  return getStrategyByComplexity(query)
}

/**
 * Estrategia basada en complejidad del query como fallback
 */
function getStrategyByComplexity(query: string): SearchStrategy {
  const wordCount = query.split(/\s+/).length
  const hasQuestionWords = /^(qué|cómo|cuándo|dónde|por qué|cuál)/i.test(query)

  if (wordCount <= 3 && !hasQuestionWords) {
    // Consulta simple -> Tier 1 (fast)
    console.log('🚀 Simple query detected -> Tier 1 (fast)')
    return {
      tier: 1,
      dimensions: 1024,
      tables: ['accommodation_units', 'policies', 'properties', 'unit_amenities'],
      description: 'Búsqueda rápida en datos principales del hotel'
    }
  } else if (wordCount <= 8) {
    // Consulta moderada -> Tier 2 (balanced)
    console.log('⚖️ Moderate query detected -> Tier 2 (balanced)')
    return {
      tier: 2,
      dimensions: 1536,
      tables: ['guest_information', 'content', 'pricing_rules', 'unit_amenities'],
      description: 'Búsqueda balanceada en información detallada del hotel'
    }
  } else {
    // Consulta compleja -> Tier 3 (full precision)
    console.log('🎯 Complex query detected -> Tier 3 (full precision)')
    return {
      tier: 3,
      dimensions: 3072,
      tables: ['all'],
      description: 'Búsqueda de máxima precisión para consultas complejas'
    }
  }
}

/**
 * Estrategia por defecto para queries indefinidos
 */
function getDefaultStrategy(): SearchStrategy {
  console.log('⚠️ Using default search strategy -> Complete hotel data')
  return {
    tier: 2, // Balanced como default
    dimensions: 1536,
    tables: ['accommodation_units', 'policies', 'guest_information', 'properties', 'content', 'pricing_rules', 'unit_amenities', 'client_info'],
    description: 'Estrategia por defecto - búsqueda completa de datos del hotel'
  }
}

/**
 * Combina múltiples estrategias para búsquedas híbridas
 */
export function getCombinedStrategy(userQuery: string): SearchStrategy[] {
  const primary = determineOptimalSearch(userQuery)
  const strategies: SearchStrategy[] = [primary]

  // Si es Tier 1, agregar Tier 2 como fallback para mayor cobertura
  if (primary.tier === 1) {
    strategies.push({
      tier: 2,
      dimensions: 1536,
      tables: ['guest_information', 'content'],
      description: 'Fallback balanceado para mayor cobertura'
    })
  }

  return strategies
}

/**
 * Valida si la estrategia es aplicable basada en datos disponibles
 */
export function validateStrategy(strategy: SearchStrategy, availableTables: string[]): boolean {
  return strategy.tables.some(table =>
    table === 'all' || availableTables.includes(table)
  )
}

/**
 * Genera parámetros para la función de búsqueda SQL
 */
export function generateSearchParams(strategy: SearchStrategy) {
  return {
    target_tables: strategy.tables,
    force_tier: strategy.tier === 1 ? 'fast' : strategy.tier === 2 ? 'balanced' : 'full',
    expected_dimensions: strategy.dimensions
  }
}