# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InnPilot is a modern web platform for managing SIRE (Sistema de Información y Registro de Extranjeros) compliance for Colombian hotels. The platform includes an intelligent chat assistant and file validation system.

**Tech Stack:**
- Next.js 14 + TypeScript + Tailwind CSS
- Supabase (PostgreSQL + pgvector for embeddings)
- OpenAI (text-embedding-3-large) + Anthropic Claude
- Deployed on Vercel US East

## Development Commands

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run lint        # Run ESLint

# API Testing (use fetch, not curl)
node -e "fetch('http://localhost:3000/api/health').then(res => res.json()).then(console.log)"
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
SUPABASE_PAT=sbp_32b777f1b90ca669a789023b6b0c0ba2e92974fa
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-api03-...
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


## Performance Status

- **pgvector search**: 300-600ms (60% improvement vs manual)
- **Chat endpoint**: 3-5s (fresh) / 0ms (cache hit)
- **Context detection**: 100% on SIRE-relevant queries

### **Status Check:**
```bash
node -e "fetch('http://localhost:3000/api/chat', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({question: '¿Cuáles son los 13 campos obligatorios del SIRE?'})}).then(res => res.json()).then(data => console.log('pgvector:', data.context_used ? '✅ Working' : '❌ No Context', '| Cache:', data.performance.cache_hit ? 'HIT' : 'MISS', '| Time:', data.performance.total_time_ms + 'ms'))"
```

## Common Issues & Solutions

- **Development server errors** → Restart: `npm run dev`
- **API endpoints returning 500** → Check server logs, restart if needed
- **pgvector intermittent failures** → Retry logic with exponential backoff implemented

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


### **MCP Development Rules:**
- Use MCP tools for database queries, not API endpoints for debugging
- Check advisories before any changes: `mcp__supabase__get_advisors()`
- Security issues must be fixed before deployment

### **🚨 CRITICAL SECURITY ISSUES:**
- [ ] RLS disabled on `document_embeddings`
- [ ] Function search_path mutable in `match_documents`

## Deploy & Production URLs

- **Platform**: Vercel US East (iad1)
- **Production**: https://innpilot.vercel.app
- **API Endpoints**: `/api/health`, `/api/chat`, `/api/validate`
- **Deploy**: `vercel --prod` or GitHub auto-deploy
- **Latest version**: d30d790 (pgvector optimized, Jan 2025)


