#!/usr/bin/env node

/**
 * MCP Queries Library for InnPilot
 * Biblioteca de consultas MCP reutilizables para desarrollo
 */

// Esta es una biblioteca de queries para usar en Claude Code con MCP
// Las queries están organizadas por categoría para fácil reutilización

export const MCP_QUERIES = {

  // ========================================
  // VERIFICACIÓN BÁSICA Y ESTADO GENERAL
  // ========================================

  basic: {
    // Conteo básico de embeddings
    countEmbeddings: "SELECT COUNT(*) as total FROM document_embeddings",

    // Estado general con timestamp
    generalStatus: `
      SELECT
        COUNT(*) as total_embeddings,
        COUNT(DISTINCT source_file) as unique_files,
        MAX(created_at) as last_created,
        MIN(created_at) as first_created
      FROM document_embeddings
    `,

    // Verificar que todos los embeddings tienen vectores
    vectorIntegrity: `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN embedding IS NULL THEN 1 ELSE 0 END) as null_vectors,
        SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as valid_vectors
      FROM document_embeddings
    `,

    // URL del proyecto y configuración básica
    projectInfo: "SELECT current_database() as database, version() as postgres_version"
  },

  // ========================================
  // ANÁLISIS DE CONTENIDO Y DISTRIBUCIÓN
  // ========================================

  content: {
    // Distribución por archivo fuente
    bySourceFile: `
      SELECT
        source_file,
        document_type,
        COUNT(*) as chunks,
        MIN(chunk_index) as min_chunk,
        MAX(chunk_index) as max_chunk,
        MAX(total_chunks) as expected_total,
        AVG(LENGTH(content)) as avg_content_length,
        MIN(LENGTH(content)) as min_content_length,
        MAX(LENGTH(content)) as max_content_length
      FROM document_embeddings
      GROUP BY source_file, document_type
      ORDER BY chunks DESC
    `,

    // Análisis detallado por chunk
    chunkAnalysis: `
      SELECT
        source_file,
        chunk_index,
        total_chunks,
        LENGTH(content) as content_length,
        embedding IS NOT NULL as has_vector,
        language,
        embedding_model,
        created_at
      FROM document_embeddings
      ORDER BY source_file, chunk_index
    `,

    // Verificar secuencia de chunks (buscar gaps)
    chunkSequence: `
      SELECT
        source_file,
        COUNT(*) as actual_chunks,
        MAX(chunk_index) - MIN(chunk_index) + 1 as expected_chunks,
        CASE
          WHEN COUNT(*) = MAX(chunk_index) - MIN(chunk_index) + 1 THEN 'COMPLETE'
          ELSE 'GAPS_DETECTED'
        END as sequence_status
      FROM document_embeddings
      GROUP BY source_file
    `,

    // Distribución por tipo de documento
    byDocumentType: `
      SELECT
        document_type,
        COUNT(*) as count,
        COUNT(DISTINCT source_file) as unique_files,
        AVG(LENGTH(content)) as avg_content_length
      FROM document_embeddings
      GROUP BY document_type
      ORDER BY count DESC
    `,

    // Análisis temporal
    temporalAnalysis: `
      SELECT
        DATE(created_at) as creation_date,
        COUNT(*) as embeddings_created,
        COUNT(DISTINCT source_file) as files_processed
      FROM document_embeddings
      GROUP BY DATE(created_at)
      ORDER BY creation_date DESC
    `
  },

  // ========================================
  // PERFORMANCE Y OPTIMIZACIÓN
  // ========================================

  performance: {
    // Estadísticas de la tabla
    tableStats: `
      SELECT
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      WHERE tablename = 'document_embeddings'
    `,

    // Uso de índices
    indexUsage: `
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE tablename = 'document_embeddings'
      ORDER BY idx_tup_read DESC
    `,

    // Tamaño de la tabla y índices
    tableSizes: `
      SELECT
        pg_size_pretty(pg_total_relation_size('document_embeddings')) as total_size,
        pg_size_pretty(pg_relation_size('document_embeddings')) as table_size,
        pg_size_pretty(pg_total_relation_size('document_embeddings') - pg_relation_size('document_embeddings')) as indexes_size
    `,

    // Análisis de memoria y cache
    cacheHitRatio: `
      SELECT
        heap_blks_read,
        heap_blks_hit,
        CASE
          WHEN heap_blks_read + heap_blks_hit = 0 THEN 0
          ELSE ROUND(100.0 * heap_blks_hit / (heap_blks_read + heap_blks_hit), 2)
        END as cache_hit_ratio
      FROM pg_statio_user_tables
      WHERE relname = 'document_embeddings'
    `
  },

  // ========================================
  // DIAGNÓSTICO Y TROUBLESHOOTING
  // ========================================

  diagnostics: {
    // Detectar problemas comunes
    commonIssues: `
      SELECT
        'Null embeddings' as issue_type,
        COUNT(*) as count,
        CASE WHEN COUNT(*) > 0 THEN 'WARNING' ELSE 'OK' END as status
      FROM document_embeddings
      WHERE embedding IS NULL

      UNION ALL

      SELECT
        'Empty content' as issue_type,
        COUNT(*) as count,
        CASE WHEN COUNT(*) > 0 THEN 'WARNING' ELSE 'OK' END as status
      FROM document_embeddings
      WHERE content IS NULL OR LENGTH(TRIM(content)) = 0

      UNION ALL

      SELECT
        'Missing metadata' as issue_type,
        COUNT(*) as count,
        CASE WHEN COUNT(*) > 0 THEN 'INFO' ELSE 'OK' END as status
      FROM document_embeddings
      WHERE document_title IS NULL
    `,

    // Verificar consistencia de chunk_index
    chunkConsistency: `
      WITH chunk_analysis AS (
        SELECT
          source_file,
          chunk_index,
          total_chunks,
          ROW_NUMBER() OVER (PARTITION BY source_file ORDER BY chunk_index) - 1 as expected_index
        FROM document_embeddings
      )
      SELECT
        source_file,
        COUNT(*) as inconsistent_chunks
      FROM chunk_analysis
      WHERE chunk_index != expected_index
      GROUP BY source_file
      HAVING COUNT(*) > 0
    `,

    // Detectar duplicados potenciales
    potentialDuplicates: `
      SELECT
        source_file,
        chunk_index,
        COUNT(*) as duplicate_count
      FROM document_embeddings
      GROUP BY source_file, chunk_index
      HAVING COUNT(*) > 1
    `,

    // Análisis de longitud de contenido (outliers)
    contentOutliers: `
      WITH stats AS (
        SELECT
          AVG(LENGTH(content)) as avg_length,
          STDDEV(LENGTH(content)) as stddev_length
        FROM document_embeddings
      )
      SELECT
        source_file,
        chunk_index,
        LENGTH(content) as content_length,
        CASE
          WHEN LENGTH(content) < (SELECT avg_length - 2 * stddev_length FROM stats) THEN 'TOO_SHORT'
          WHEN LENGTH(content) > (SELECT avg_length + 2 * stddev_length FROM stats) THEN 'TOO_LONG'
          ELSE 'NORMAL'
        END as length_status
      FROM document_embeddings
      WHERE LENGTH(content) < (SELECT avg_length - 2 * stddev_length FROM stats)
         OR LENGTH(content) > (SELECT avg_length + 2 * stddev_length FROM stats)
      ORDER BY content_length DESC
    `
  },

  // ========================================
  // METADATOS Y CONFIGURACIÓN
  // ========================================

  metadata: {
    // Distribución por idioma
    byLanguage: `
      SELECT
        language,
        COUNT(*) as count,
        COUNT(DISTINCT source_file) as unique_files
      FROM document_embeddings
      GROUP BY language
      ORDER BY count DESC
    `,

    // Distribución por modelo de embedding
    byEmbeddingModel: `
      SELECT
        embedding_model,
        COUNT(*) as count,
        MIN(created_at) as first_use,
        MAX(created_at) as last_use
      FROM document_embeddings
      GROUP BY embedding_model
      ORDER BY count DESC
    `,

    // Campos con valores nulos
    nullFields: `
      SELECT
        'token_count' as field_name,
        COUNT(*) as total_rows,
        SUM(CASE WHEN token_count IS NULL THEN 1 ELSE 0 END) as null_count,
        ROUND(100.0 * SUM(CASE WHEN token_count IS NULL THEN 1 ELSE 0 END) / COUNT(*), 2) as null_percentage
      FROM document_embeddings

      UNION ALL

      SELECT
        'document_title' as field_name,
        COUNT(*) as total_rows,
        SUM(CASE WHEN document_title IS NULL THEN 1 ELSE 0 END) as null_count,
        ROUND(100.0 * SUM(CASE WHEN document_title IS NULL THEN 1 ELSE 0 END) / COUNT(*), 2) as null_percentage
      FROM document_embeddings

      UNION ALL

      SELECT
        'page_number' as field_name,
        COUNT(*) as total_rows,
        SUM(CASE WHEN page_number IS NULL THEN 1 ELSE 0 END) as null_count,
        ROUND(100.0 * SUM(CASE WHEN page_number IS NULL THEN 1 ELSE 0 END) / COUNT(*), 2) as null_percentage
      FROM document_embeddings
    `,

    // Esquema de la tabla
    tableSchema: `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'document_embeddings'
        AND table_schema = 'public'
      ORDER BY ordinal_position
    `
  },

  // ========================================
  // MONITOREO Y ALERTAS
  // ========================================

  monitoring: {
    // Health check básico
    healthCheck: `
      SELECT
        'document_embeddings' as table_name,
        COUNT(*) as total_rows,
        COUNT(DISTINCT source_file) as unique_files,
        SUM(CASE WHEN embedding IS NULL THEN 1 ELSE 0 END) as null_embeddings,
        MAX(created_at) as last_update,
        CASE
          WHEN COUNT(*) = 0 THEN 'CRITICAL'
          WHEN SUM(CASE WHEN embedding IS NULL THEN 1 ELSE 0 END) > 0 THEN 'WARNING'
          ELSE 'OK'
        END as health_status
      FROM document_embeddings
    `,

    // Verificación de crecimiento
    growthCheck: `
      SELECT
        DATE(created_at) as date,
        COUNT(*) as embeddings_added,
        LAG(COUNT(*)) OVER (ORDER BY DATE(created_at)) as previous_day,
        COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY DATE(created_at)) as daily_change
      FROM document_embeddings
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `,

    // Alertas de capacidad
    capacityAlert: `
      SELECT
        COUNT(*) as current_embeddings,
        CASE
          WHEN COUNT(*) > 100000 THEN 'HIGH_USAGE'
          WHEN COUNT(*) > 50000 THEN 'MEDIUM_USAGE'
          ELSE 'LOW_USAGE'
        END as capacity_status,
        pg_size_pretty(pg_total_relation_size('document_embeddings')) as total_size
      FROM document_embeddings
    `
  }
};

// ========================================
// FUNCIONES HELPER PARA MCP
// ========================================

export const MCP_HELPERS = {

  // Template para ejecutar queries via MCP
  executeQuery: (queryKey, category = 'basic') => {
    const query = MCP_QUERIES[category]?.[queryKey];
    if (!query) {
      throw new Error(`Query not found: ${category}.${queryKey}`);
    }

    return {
      function: 'mcp__supabase__execute_sql',
      params: { query },
      description: `Executing ${category}.${queryKey}`
    };
  },

  // Template para advisories
  getAdvisors: (type = 'security') => ({
    function: 'mcp__supabase__get_advisors',
    params: { type },
    description: `Getting ${type} advisors`
  }),

  // Template para búsqueda en docs
  searchDocs: (searchQuery, limit = 3) => ({
    function: 'mcp__supabase__search_docs',
    params: {
      graphql_query: `{
        searchDocs(query: "${searchQuery}", limit: ${limit}) {
          nodes {
            title
            href
            ... on Guide {
              subsections {
                nodes {
                  title
                  content
                }
              }
            }
          }
        }
      }`
    },
    description: `Searching docs for: ${searchQuery}`
  }),

  // Workflow completo de verificación
  fullHealthCheck: () => [
    MCP_HELPERS.executeQuery('generalStatus', 'basic'),
    MCP_HELPERS.executeQuery('vectorIntegrity', 'basic'),
    MCP_HELPERS.executeQuery('healthCheck', 'monitoring'),
    MCP_HELPERS.getAdvisors('security'),
    MCP_HELPERS.getAdvisors('performance')
  ]
};

// ========================================
// EJEMPLOS DE USO
// ========================================

export const USAGE_EXAMPLES = {

  // Verificación diaria estándar
  dailyCheck: `
    // 1. Estado general
    mcp__supabase__execute_sql({query: "${MCP_QUERIES.basic.generalStatus}"})

    // 2. Verificar integridad
    mcp__supabase__execute_sql({query: "${MCP_QUERIES.basic.vectorIntegrity}"})

    // 3. Revisar advisories
    mcp__supabase__get_advisors({type: "security"})
    mcp__supabase__get_advisors({type: "performance"})
  `,

  // Debugging de issues
  debuggingWorkflow: `
    // 1. Identificar problemas
    mcp__supabase__execute_sql({query: "${MCP_QUERIES.diagnostics.commonIssues}"})

    // 2. Analizar contenido
    mcp__supabase__execute_sql({query: "${MCP_QUERIES.content.bySourceFile}"})

    // 3. Verificar chunks
    mcp__supabase__execute_sql({query: "${MCP_QUERIES.content.chunkSequence}"})
  `,

  // Análisis de performance
  performanceAnalysis: `
    // 1. Estadísticas de tabla
    mcp__supabase__execute_sql({query: "${MCP_QUERIES.performance.tableStats}"})

    // 2. Uso de índices
    mcp__supabase__execute_sql({query: "${MCP_QUERIES.performance.indexUsage}"})

    // 3. Cache hit ratio
    mcp__supabase__execute_sql({query: "${MCP_QUERIES.performance.cacheHitRatio}"})
  `
};

console.log('📋 MCP Queries Library loaded');
console.log('Available categories:', Object.keys(MCP_QUERIES));
console.log('Use MCP_HELPERS.executeQuery(queryKey, category) for easy execution');

export default { MCP_QUERIES, MCP_HELPERS, USAGE_EXAMPLES };