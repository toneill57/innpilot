# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InnPilot is a modern web platform for managing SIRE (Sistema de Información y Registro de Extranjeros) compliance for Colombian hotels. The platform includes an intelligent chat assistant and file validation system.

**Tech Stack:**
- Next.js 14 + TypeScript + Tailwind CSS
- Supabase (PostgreSQL + pgvector for embeddings)
- OpenAI (text-embedding-3-large) + Anthropic Claude
- Deployed on Vercel US East

## Key Development Commands

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production with Turbopack
npm start           # Start production server
npm run lint        # Run ESLint

# API Integration

**Método Recomendado: fetch() - NO usar curl**

## JavaScript/fetch examples:
```javascript
// Local development (preferred)
const healthCheck = await fetch('http://localhost:3000/api/health')
  .then(res => res.json());

const chatResponse = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: "¿Cuáles son los 13 campos obligatorios del SIRE?"
  })
}).then(res => res.json());

// Production calls
const prodHealthCheck = await fetch('https://innpilot.vercel.app/api/health')
  .then(res => res.json());
```

## Node.js testing commands:
```bash
# Quick health check
node -e "fetch('http://localhost:3000/api/health').then(res => res.json()).then(console.log)"

# Quick chat test with status
node -e "fetch('http://localhost:3000/api/chat', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({question: '¿Cuáles son los 13 campos obligatorios del SIRE?'})}).then(res => res.json()).then(data => console.log('Status:', data.performance ? 'SUCCESS' : 'ERROR', '- Time:', data.performance?.total_time_ms + 'ms'))"
```

## Architecture

### Frontend Components
- **Dashboard**: Main interface with tabbed navigation (upload, chat, reports)
- **FileUploader**: Drag-and-drop SIRE file validation with real-time feedback
- **ChatAssistant**: AI-powered chat interface for SIRE questions
- **UI Components**: Custom shadcn/ui components (Button, Card, Input)

### API Routes (Edge Runtime)
- `GET/POST /api/chat` - Chat assistant with context retrieval + memory cache
- `POST /api/validate` - File validation for SIRE format
- `GET /api/health` - Health check with service status

### Vector Search Implementation ✅ OPTIMIZED
- **Status**: ✅ pgvector NATIVE active with `match_documents()` function
- **Performance**: ~300-600ms vector search (60% improvement vs manual)
- **Architecture**: OpenAI embeddings → pgvector native → Context retrieval → Claude response
- **Database**: Supabase with vector(3072) embeddings + semantic cache

## Environment Variables

Required in `.env.local`:
```
SUPABASE_URL=https://ooaumjzaztmutltifhoq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_PAT=sbp_... # Personal Access Token for MCP integration
OPENAI_API_KEY=sk-proj-ipB48deRibaLRwMy8QwErL3hw_woS8iQ...
ANTHROPIC_API_KEY=sk-ant-api03-MvQDTIR4rVe1srvytlNAc3M6sg02g9W...
CLAUDE_MODEL=claude-3-5-haiku-20241022
CLAUDE_MAX_TOKENS=800
```

### **Supabase Keys Overview:**
- **`SUPABASE_ANON_KEY`**: Public key for frontend client operations (RLS enforced)
- **`SUPABASE_SERVICE_ROLE_KEY`**: Server-side key with elevated permissions (bypasses RLS)
- **`SUPABASE_PAT`**: Personal Access Token for MCP development tools (project management access)

## Database Schema (Supabase)

`document_embeddings` table with vector(3072) embeddings. ✅ **pgvector native function active** with `match_documents()` for optimized similarity search.

## Document Chunking Strategy

Uses LangChain RecursiveCharacterTextSplitter with 1000 char chunks, 100 char overlap.
Configuration in `src/lib/chunking.ts`. Results: 9 chunks (68% reduction from 28).


## Sistema & Performance (Septiembre 2025) ✅

### **Estado Actual:**
- ✅ **Todos los endpoints funcionando** (200 OK)
- ✅ **pgvector nativo activo** - búsqueda vectorial optimizada
- ✅ **Cache semántico funcionando** - agrupación inteligente
- ✅ **Servidor desarrollo estable** (post-restart Sept 2025)
- ✅ **Edge Runtime compatible** - todos los problemas resueltos

### **Performance Métricas:**
- **Health endpoint**: ~800ms primera vez, inmediato en siguientes
- **Chat endpoint**: 3-5s (fresh) / 0ms (cache hit)
- **pgvector search**: 300-600ms por búsqueda
- **Context detection**: 100% en queries SIRE relevantes
- **Cache hit rate**: Optimizado con agrupación semántica

### **Quick Status Check:**
```bash
# Verificar pgvector working (debe mostrar "✅ Using native vector search function")
node -e "fetch('http://localhost:3000/api/chat', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({question: '¿Cuáles son los 13 campos obligatorios del SIRE?'})}).then(res => res.json()).then(data => console.log('pgvector:', data.context_used ? '✅ Working' : '❌ No Context', '| Cache:', data.performance.cache_hit ? 'HIT' : 'MISS', '| Time:', data.performance.total_time_ms + 'ms'))"
```

### **Benchmarks Disponibles:**
```bash
# Comparación rápida localhost vs Vercel (5 questions, ~2 min)
node scripts/quick-pgvector-benchmark.js

# Análisis detallado (15 questions, 3 iterations, ~10 min)
node scripts/benchmark-pgvector-comparison.js
```

## Issues Resolved & Solutions ✅

### **Problemas Resueltos (Sept 2025):**
- ✅ **500 Internal Server Errors**: Resueltos con restart del servidor de desarrollo
- ✅ **buildManifest.js errors**: Eliminados con servidor limpio
- ✅ **"Vector search failed"**: pgvector function working properly
- ✅ **"No results from search"**: embedding format correcto (vector(3072))
- ✅ **"No context found"**: Document chunking optimizado, detección 100%
- ✅ **Edge Runtime compatibility**: Todos los problemas resueltos

### **Soluciones Comunes:**
- **buildManifest.js temporary file errors** → Restart: `npm run dev`
- **API endpoints returning 500** → Check server logs, restart if needed
- **Development server instability** → Kill existing process and restart fresh
- **pgvector intermittent failures** → Retry logic implementado con exponential backoff

## MCP Integration (Model Context Protocol) ✅

### **Estado: ✅ Configurado y funcionando - MÉTODO PRINCIPAL DE DESARROLLO**
- **Servicio**: Supabase MCP en modo read-only
- **Project**: ooaumjzaztmutltifhoq (InnPilot)
- **Autenticación**: Personal Access Token (SUPABASE_PAT)
- **Configuración**: User scope (disponible en todas las sesiones)

### **🔧 Configuración MCP Actualizada (Septiembre 2025)**

**Estado actual:**
- ✅ **Servidor MCP**: Configurado en user scope para disponibilidad global
- 🔄 **Herramientas MCP**: Disponibles en nuevas sesiones de Claude Code
- 🛠️ **Scripts alternativos**: Disponibles para acceso directo cuando MCP no está cargado

**Quick Status Check:**
```bash
# Verificar estado del servidor MCP
node scripts/check-mcp-status.js

# Acceso directo a Supabase (alternativa a MCP tools)
node scripts/direct-supabase-query.js
```

**Troubleshooting MCP Tools:**
- **Problema**: MCP tools no disponibles en sesión actual
- **Solución**: Reiniciar Claude Code o usar scripts directos
- **Verificación**: `claude mcp list` debe mostrar "✓ Connected"

### **🚀 Configuración MCP desde Cero (Setup Instructions)**

Si necesitas configurar MCP en un nuevo entorno:

```bash
# 1. Verificar que Claude Code está instalado
claude --version

# 2. Agregar el servidor Supabase MCP a user scope
claude mcp add-json --scope user supabase '{
  "type": "stdio",
  "command": "npx",
  "args": ["@supabase/mcp-server-supabase", "--project-ref=ooaumjzaztmutltifhoq"],
  "env": {"SUPABASE_ACCESS_TOKEN": "sbp_32b777f1b90ca669a789023b6b0c0ba2e92974fa"}
}'

# 3. Verificar que está conectado
claude mcp list

# 4. Verificar funcionamiento
node scripts/check-mcp-status.js
```

**⚠️ Nota importante:** Las herramientas MCP (`mcp__supabase__*`) solo están disponibles en **nuevas sesiones** de Claude Code. Si acabas de configurar MCP, necesitas reiniciar Claude Code para que las herramientas estén disponibles.

## 🎯 MCP-First Development Workflow

### **REGLA: TODO EL DESARROLLO SE HACE VIA MCP**
- ✅ **USAR**: Funciones MCP para todas las consultas de DB
- ❌ **NO USAR**: API endpoints para debugging
- ✅ **VERIFICAR**: Estado via MCP antes de cualquier cambio
- ✅ **MONITOREAR**: Advisories continuamente con MCP

### **Capacidades disponibles con MCP:**
- 🔍 **Acceso directo** a base de datos y esquemas
- 📊 **Consulta de embeddings** y métricas de pgvector en tiempo real
- 🛠️ **Ejecución de SQL queries** (read-only para seguridad)
- ⚡ **Monitoreo de performance** y advisories de Supabase
- 📚 **Búsqueda en documentación** de Supabase integrada

### **🔄 Flujo de Trabajo Estándar MCP:**

#### **1. Verificación Inicial (SIEMPRE antes de trabajar)**
```javascript
// Verificar estado general
mcp__supabase__execute_sql({query: "SELECT COUNT(*) as total, MAX(created_at) as last_update FROM document_embeddings"})

// Revisar advisories críticos
mcp__supabase__get_advisors({type: "security"})
mcp__supabase__get_advisors({type: "performance"})
```

#### **2. Análisis de Datos (Para debugging)**
```javascript
// Verificar integridad de embeddings
mcp__supabase__execute_sql({query: `
  SELECT
    source_file,
    COUNT(*) as chunks,
    MAX(chunk_index) - MIN(chunk_index) + 1 as expected_chunks,
    SUM(CASE WHEN embedding IS NULL THEN 1 ELSE 0 END) as null_vectors
  FROM document_embeddings
  GROUP BY source_file
`})

// Analizar distribución de contenido
mcp__supabase__execute_sql({query: `
  SELECT
    chunk_index,
    LENGTH(content) as content_length,
    embedding IS NOT NULL as has_vector
  FROM document_embeddings
  ORDER BY chunk_index
`})
```

#### **3. Monitoreo de Performance**
```javascript
// Verificar extensiones críticas
mcp__supabase__list_extensions()

// Buscar optimizaciones
mcp__supabase__search_docs({
  graphql_query: `{
    searchDocs(query: "pgvector optimization", limit: 3) {
      nodes { title href }
    }
  }`
})
```

### **📋 Comandos MCP Rápidos:**
```javascript
// Estado básico
mcp__supabase__get_project_url()
mcp__supabase__list_tables({schemas: ["public"]})

// Consultas frecuentes
mcp__supabase__execute_sql({query: "SELECT COUNT(*) FROM document_embeddings"})
mcp__supabase__execute_sql({query: "SELECT DISTINCT document_type FROM document_embeddings"})

// Advisories
mcp__supabase__get_advisors({type: "security"})
mcp__supabase__get_advisors({type: "performance"})

// Documentación
mcp__supabase__search_docs({graphql_query: "{searchDocs(query: \"pgvector\", limit: 2) {nodes {title href}}}"})
```

### **Scripts de Testing MCP:**
```bash
# ✅ DISPONIBLES - Verificar estado del servidor MCP
node scripts/check-mcp-status.js

# ✅ DISPONIBLES - Acceso directo a Supabase (cuando MCP tools no disponibles)
node scripts/direct-supabase-query.js

# 🔄 TODO - Test integral de todas las funciones MCP
node scripts/test-mcp-integration.js

# 🔄 TODO - Monitoreo específico de embeddings via MCP
node scripts/monitor-embeddings-mcp.js

# 🔄 TODO - Health check completo del sistema MCP
node scripts/mcp-health-check.js
```

### **Beneficios específicos para desarrollo:**
- **Debugging**: Consulta directa de embeddings sin salir de Claude
- **Performance**: Análisis en tiempo real de búsquedas vectoriales
- **Seguridad**: Verificación automática de RLS y vulnerabilidades
- **Documentación**: Acceso instantáneo a docs de Supabase actualizadas

## 📋 Guías de Desarrollo MCP-First

### **REGLAS OBLIGATORIAS PARA TODO DESARROLLO:**

#### **🔴 ANTES de empezar cualquier tarea:**
```javascript
// 1. SIEMPRE verificar estado del sistema
mcp__supabase__execute_sql({query: "SELECT COUNT(*) as total, MAX(created_at) as last_update FROM document_embeddings"})

// 2. SIEMPRE revisar advisories críticos
mcp__supabase__get_advisors({type: "security"})
mcp__supabase__get_advisors({type: "performance"})

// 3. Si hay ERRORS en security → STOP y fix primero
```

#### **🟡 DURANTE el desarrollo:**
```javascript
// Para debugging → USAR MCP, NO API endpoints
mcp__supabase__execute_sql({query: "SELECT * FROM document_embeddings WHERE source_file = 'archivo.md'"})

// Para verificar cambios → USAR MCP
mcp__supabase__execute_sql({query: "SELECT COUNT(*) FROM document_embeddings"})

// Para buscar documentación → USAR MCP
mcp__supabase__search_docs({graphql_query: "{searchDocs(query: \"tu búsqueda\") {nodes {title href}}}"})
```

#### **🟢 DESPUÉS de cambios:**
```javascript
// 1. Verificar integridad post-cambio
mcp__supabase__execute_sql({query: "SELECT COUNT(*) as total, SUM(CASE WHEN embedding IS NULL THEN 1 ELSE 0 END) as null_vectors FROM document_embeddings"})

// 2. Verificar que no se introdujeron nuevos advisories
mcp__supabase__get_advisors({type: "security"})

// 3. Solo DESPUÉS hacer deploy/commit
```

### **❌ PROHIBIDO en Desarrollo:**

1. **NO usar** `curl http://localhost:3000/api/` para debugging
2. **NO hacer** cambios sin verificar MCP advisories primero
3. **NO deployar** con advisories de seguridad ERROR
4. **NO ignorar** warnings de MCP sin documentar por qué

### **✅ WORKFLOW ESTÁNDAR (Usar scripts):**

```bash
# 1. Quick check diario
node scripts/workflow-mcp.js --quick

# 2. Análisis completo semanal
node scripts/workflow-mcp.js

# 3. Monitoreo automático
node scripts/mcp-auto-monitor.js --daily

# 4. Debugging específico
node scripts/mcp-queries.js  # Ver ejemplos de queries
```

### **🚨 ISSUES DE SEGURIDAD PENDIENTES:**

**CRÍTICO - Resolver INMEDIATAMENTE:**
- [ ] RLS deshabilitado en `document_embeddings`
- [ ] Function search_path mutable en `match_documents`

**Ver detalles completos**: `SECURITY_FIXES.md`

### **📈 MÉTRICAS DE ÉXITO MCP:**

- **Health Score Target**: >85/100
- **Security Advisors**: 0 ERROR level
- **Performance Advisors**: <3 total
- **Response Time**: MCP queries <100ms
- **Uptime**: 99.9% via MCP monitoring

## Deploy & Production URLs

- **Platform**: Vercel US East (iad1)
- **Production**: https://innpilot.vercel.app
- **API Endpoints**: `/api/health`, `/api/chat`, `/api/validate`
- **Deploy**: `vercel --prod` or GitHub auto-deploy
- **Latest version**: d30d790 (pgvector optimized, Jan 2025)

## cURL Reference (usar fetch() preferido)

```bash
# Solo para debugging/testing - usar fetch() para desarrollo normal
curl http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"question":"¿Cuáles son los 13 campos obligatorios del SIRE?"}'
```

