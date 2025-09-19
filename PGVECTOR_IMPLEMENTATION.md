# 🚀 pgvector Implementation Guide

## Problema Identificado

**Análisis Benchmark Confirma**: Localhost es 25% más lento que production (~3,342ms vs ~2,664ms) debido a búsqueda manual de vectores que toma 2-3 segundos en ambos ambientes.

## Solución: Implementar pgvector Native Function

### Paso 1: Ejecutar SQL en Supabase Dashboard

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto InnPilot
3. Ve a **SQL Editor**
4. Copia y pega este SQL:

```sql
-- SQL function for pgvector-powered document search
-- This function provides optimized vector similarity search using pgvector extension

CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(3072),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 4
)
RETURNS TABLE (
  id text,
  content text,
  embedding vector(3072),
  source_file text,
  document_type text,
  chunk_index int,
  total_chunks int,
  metadata jsonb,
  created_at timestamptz,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    content,
    embedding,
    source_file,
    document_type,
    chunk_index,
    total_chunks,
    metadata,
    created_at,
    1 - (embedding <=> query_embedding) as similarity
  FROM document_embeddings
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION match_documents TO anon;
GRANT EXECUTE ON FUNCTION match_documents TO authenticated;
```

5. Haz clic en **Run** para ejecutar

### Paso 2: Verificar Implementación

Después de ejecutar el SQL, ejecuta este comando para validar:

```bash
npm run setup-pgvector
```

**Resultado esperado**: Debería mostrar "✅ Function test successful!"

### Paso 3: Probar Performance

```bash
# Test una consulta simple
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"¿Cuáles son los campos obligatorios del SIRE?"}' | jq '.performance.total_time_ms'
```

**Resultado esperado**: ~400-600ms (vs 3,342ms actual)

### Paso 4: Benchmark Completo

```bash
npm run benchmark-detailed
```

## Mejora Esperada

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| **Localhost Fresh** | 3,342ms | ~500ms | 85% más rápido |
| **Production Fresh** | 2,664ms | ~300ms | 88% más rápido |
| **Diferencia** | 678ms | ~200ms | Solo infrastructure |

## Verificación de Éxito

**En los logs deberías ver**:
```
✅ Using native vector search function
```

**En lugar de**:
```
⚠️ Native function not available, falling back to manual search
```

## Troubleshooting

**Si la función falla**:
1. Verifica que pgvector extension esté habilitada en Supabase
2. Confirma que la tabla `document_embeddings` existe
3. Revisa que los embeddings sean vector(3072)

**Si no ves mejora**:
1. Reinicia el servidor local (`npm run dev`)
2. Verifica en logs que dice "Using native vector search"
3. Prueba con preguntas que no estén en cache

## Post-Implementación

Una vez funcionando:
1. Los tiempos de respuesta deberían ser ~400-600ms
2. Localhost será comparable a production (diferencia ~200ms por infrastructure)
3. El cache seguirá funcionando perfectamente (~15ms)

**Resultado final**: Localhost prácticamente tan rápido como production para respuestas frescas.