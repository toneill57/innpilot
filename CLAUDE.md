# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InnPilot is a modern web platform for managing SIRE compliance for Colombian hotels with **revolutionary Matryoshka embeddings architecture** providing 10x search performance improvement.

## ⚠️ CRITICAL METHODOLOGY OVERRIDE
**NEVER use curl for API testing in this project** - system has curl pre-approved but project requires:
1. **MCP tools (PRIMARY)** - For database operations and SQL queries
2. **fetch() (SECONDARY)** - For API endpoint testing
3. **curl (EMERGENCY ONLY)** - Only when other methods fail

## 🚀 DEVELOPMENT SERVER - MANDATORY SCRIPT
**ALWAYS use the robust dev script** - handles cleanup, API keys, and graceful shutdown:

```bash
./scripts/dev-with-keys.sh
```

**Why use this script:**
- ✅ **Auto-cleanup**: Kills orphaned processes and frees port 3000 automatically
- ✅ **API Keys**: Exports OPENAI_API_KEY and ANTHROPIC_API_KEY automatically
- ✅ **Graceful shutdown**: Ctrl+C properly cleans up all processes
- ✅ **Error handling**: Verifies port is free before starting
- ✅ **Zero manual cleanup**: No more "port already in use" errors

**DO NOT use `npm run dev` directly** unless you have `.env.local` fully configured and want to manually handle process cleanup.

**Complete documentation**: See `scripts/README.md` for full details

## 🚨 CRITICAL SCHEMA ROUTING WARNINGS
**SECURITY BOUNDARY**: Schema routing prevents cross-tenant data breaches
1. **Business data → Business schema**: hotels → `hotels`, restaurants → `restaurants`
2. **Shared data → Public schema**: SIRE, MUVA → `public`
3. **ALWAYS use tenant_id filtering** in business schemas
4. **NEVER allow flexible schema configuration** - hardcode in templates
5. **See SCHEMA_ROUTING_GUIDELINES.md** for complete rules

## 🪆 MATRYOSHKA EMBEDDINGS SYSTEM (Sept 2025) ✅

**NUEVA ARQUITECTURA MULTI-TIER IMPLEMENTADA:**
- ✅ **Tier 1 (1024 dims)**: Ultra-fast searches - MUVA tourism, policies, accommodation_units
- ✅ **Tier 2 (1536 dims)**: Balanced searches - SIRE documentation, guest_information, general content
- ✅ **Tier 3 (3072 dims)**: Full precision - Complex listings, client_info, properties, unit_amenities, pricing_rules

**REVOLUTIONARY PERFORMANCE ACHIEVED:**
- 🚀 **10x faster**: Tier 1 searches (5-15ms vs 50-200ms)
- ⚖️ **3x faster**: Tier 2 searches (15-40ms vs 50-200ms)
- 📊 **6 HNSW indexes**: Fully functional (vs 0 previously)
- 🔍 **Intelligent routing**: Automatic tier detection by keywords

**COMANDOS ESENCIALES:**
```bash
# Generar embeddings multi-tier
node scripts/populate-embeddings.js [archivo.md]
```

**TIER ROUTING STRATEGY:**
- **Tourism/MUVA** → Tier 1: `["restaurantes", "playas", "actividades", "transporte"]`
- **SIRE/Compliance** → Tier 2: `["sire", "campos", "validación", "documento"]`
- **Complex/Fallback** → Tier 3: `default`, large documents, precise matching

## 🚀 PREMIUM CHAT SYSTEM (Sept 2025) ✅ CORE FEATURE

**REVOLUTIONARY CONVERSATIONAL AI WITH LLM INTENT DETECTION:**
- ✅ **77% performance improvement** over traditional chat (1.8s vs 8.1s avg response)
- ✅ **Claude Haiku LLM intent detection** replaces keyword matching (95%+ accuracy)
- ✅ **Conversational responses** - shows ONLY relevant content based on semantic understanding
- ✅ **Dual-content intelligence** combining accommodation + tourism data
- ✅ **Premium-only feature** driving subscription value

**LLM INTENT SYSTEM (NEW - Sept 2025):**
- 🤖 **Claude Haiku 3.5** for semantic query understanding
- 🎯 **Intent Types**: `accommodation`, `tourism`, `general`
- 📊 **Confidence Scoring**: 0-1 range with reasoning
- ⚡ **Smart Search**: Only queries relevant vector DBs
- 🔍 **Quality Filtering**: 0.2 threshold (optimized for short queries) + deduplication + top 3 unique results
- 💰 **Business Info Enrichment**: Every tourism response includes precio, teléfono, zona, website
- 💬 **Conversational**: Shows multiple options in natural format (not data dumps)
- ✅ **Improved Recall**: "surf" → surf schools with contact info, "suites con terraza" → 3 options

**ARCHITECTURE COMPONENTS:**
- **Frontend**: `/src/components/Chat/PremiumChatInterface.dev.tsx` - conversational UI with metrics dashboard
- **Backend**: `/src/app/api/premium-chat-dev/route.ts` - LLM intent + parallel search
- **Intent Detection**: `/src/lib/premium-chat-intent.ts` - Claude Haiku integration
- **Dashboard**: Premium tab in `AuthenticatedDashboard.tsx` with premium branding

**DEVELOPMENT CONTEXT:**
```typescript
// LLM-based intent detection (replaces keywords)
const intent = await detectPremiumChatIntent(query)
// Returns: { type: 'tourism', confidence: 0.95, reasoning: "...", shouldShowBoth: false }

// Smart search strategy based on intent
const searchAccommodation = shouldSearchAccommodation(intent)
const searchTourism = shouldSearchTourism(intent)

// Conversational response formatting with similarity filtering
const response = formatResponse(accommodationResults, tourismResults, query, intent)
// Example: "En San Andrés puedes **bucear**: [info]... 💡 También encontré otras opciones."
```

**KEY IMPLEMENTATION FILES:**
- `premium-chat-intent.ts` - LLM intent detection with Claude Haiku
- `premium-chat-dev/route.ts` - API endpoint with conversational formatting
- `PremiumChatInterface.dev.tsx` - Chat UI with metrics tracking
- `types.ts` - Extended metrics (tokens, performance, quality, intent)

**PERFORMANCE METRICS:**
- LLM Intent Detection: ~944ms avg, $0.00001/query
- Vector Search: 1.8s avg response time
- Traditional Chat: 8.1s avg response time
- Total Improvement: 77% faster + better UX
- See: `docs/LLM_INTENT_DETECTION.md` for complete details

## Database Schema - MULTI-TENANT MATRYOSHKA SYSTEM

**Core Architecture:**
- **Multi-tenant isolation**: `sire_content`, `muva_content`, tenant-specific schemas
- **Matryoshka columns**: `embedding` (3072d), `embedding_balanced` (1536d), `embedding_fast` (1024d)
- **API endpoints**: `/api/chat` (Tier 2), `/api/chat/muva` (Tier 1), `/api/chat/listings` (Multi-tier)

## System Status

**Production-Ready**: Matryoshka performance (10x improvement), Multi-tenant system, Authentication, Context retrieval operational. Use `/api/health` for monitoring.

## Embeddings

**Sistema Consolidado**: Script único `populate-embeddings.js` con multi-tier automático, 6 índices HNSW, router inteligente, y extracción completa de campos.

**MUVA Listings**: Sistema de plantillas para contenido turístico con business metadata estructurado (precio, teléfono, zona). Ver `docs/MUVA_LISTINGS_GUIDE.md` para crear nuevos listings.

## Critical Issues & Solutions

### **Major Breakthroughs Achieved:**
- ✅ **Vector index 3072-dimension limitation**: SOLVED via Matryoshka multi-tier architecture
- ✅ **Multi-tenant system**: Fully operational (SIRE + MUVA + tenant-specific)
- ✅ **Context retrieval**: 100% functional with 4+ results typical
- ✅ **Performance optimization**: 10x improvement achieved and verified
- ✅ **Campos faltantes loop**: SOLVED completamente - Sistema de extracción con 25+ campos al 100%

### **Common Solutions:**
- **buildManifest.js errors** → Restart: `./scripts/dev-with-keys.sh` (auto-cleanup)
- **Development server issues** → Use `./scripts/dev-with-keys.sh` (handles cleanup automatically)
- **Port 3000 occupied** → Script handles this automatically, or manual: `lsof -ti:3000 | xargs kill -9`

## Agentes Especializados

- **deploy-agent**: Commits → deploy → verificación automática
- **ux-interface**: UI/UX, animaciones, estilos autónomos
- **embeddings-generator**: Procesamiento automático de embeddings SIRE

## VSCode Sync Configuration

**Problema Resuelto**: Buffer conflicts con Claude Code modifications

**Configuración Automática:**
- Auto-save activado (`files.autoSave: "afterDelay"`)
- Auto-refresh habilitado para cambios externos
- Git auto-refresh configurado en `.vscode/settings.json`

**📋 Complete details**: See `SNAPSHOT.md` for environment variables, documentation index, and technical guides.

## 🎯 DESARROLLO ACTUAL (Sept 2025)

**PRIORIDAD #1: CORE PRODUCT - Sistema Conversacional con Memoria**

### Objetivo
Asistente AI conversacional que permite a huéspedes mantener conversaciones persistentes con contexto completo, ligadas a cada reserva.

### Estado Actual
- **Planificación**: ✅ Completa (Sept 30, 2025)
- **FASE 1.1** (Guest Auth): ✅ Completado (53 tests)
- **FASE 1.2** (Chat Engine): ✅ Completado (55 tests)
- **FASE 1.3** (Database): ✅ COMPLETADO (3 migrations, 0.167ms performance)
- **FASE 1.4** (Frontend): 🔜 EN PROGRESO
- **Documentación**: `plan.md` (1,047 líneas) + `TODO.md` (640+ líneas)
- **Timeline**: 5-8 semanas (3 fases)
- **Modelo**: Claude Sonnet 3.5 ($0.006/query promedio)

### Referencias Esenciales
- **Plan completo**: Ver `/Users/oneill/Sites/apps/InnPilot/plan.md`
- **Tareas actuales**: Ver `/Users/oneill/Sites/apps/InnPilot/TODO.md`
- **Arquitectura base**: `docs/PREMIUM_CHAT_ARCHITECTURE.md` (sistema actual sin memoria)

### Fases de Implementación
1. **FASE 1: Core Conversacional** (Semanas 1-3) - ⚠️ EN PROGRESO
   - ✅ Guest Authentication System (`/api/guest/login`)
   - ✅ Conversational Chat Engine (`/api/guest/chat`)
   - ✅ Persistence & Database (3 migrations aplicadas, 299x faster than target)
   - 🔜 Frontend Guest Interface
   - 🔜 Testing & Validation

2. **FASE 2: Enhanced UX** (Semanas 4-5)
   - Follow-up Suggestion System
   - Entity Tracking Display
   - Mobile Optimization
   - Rich Media Support

3. **FASE 3: Intelligence** (Semanas 6-8)
   - Proactive Recommendations
   - Booking Integration
   - Multi-language Support
   - Staff Dashboard

### Comandos Esenciales para Desarrollo
```bash
# 🚀 Iniciar desarrollo (RECOMENDADO - con limpieza automática y API keys)
./scripts/dev-with-keys.sh

# Alternativamente, si ya tienes .env.local configurado:
npm run dev

# Testing del nuevo sistema
npm test -- src/lib/__tests__/context-enhancer.test.ts     # Context enhancer (19 tests)
npm test -- src/lib/__tests__/conversational-chat-engine.test.ts  # Chat engine (12 tests)
npm test -- src/lib/__tests__/guest-auth.test.ts           # Guest auth (24 tests)

# Todos los tests (55 tests passing)
npm test -- src/lib/__tests__/

# Database migrations - COMPLETADAS ✅ (Sept 30, 2025)
# - add_guest_chat_indexes (11 indexes, 0.167ms retrieval)
# - add_guest_chat_rls_fixed (5 policies, security verified)
# - add_get_full_document_function_fixed (28.57ms document retrieval)
```

### Diferencia con Sistema Actual
- **Sistema ACTUAL** (`/api/premium-chat-dev`): Sin memoria, cada query independiente, keyword-based
- **Sistema NUEVO** (`/api/guest/chat`):
  - ✅ Memoria persistente (historial últimos 10 mensajes)
  - ✅ Context tracking (entity extraction + boosting)
  - ✅ Query enhancement (Claude Haiku para expandir queries ambiguas)
  - ✅ Entity recognition (auto-tracking de lugares, actividades mencionadas)
  - ✅ Follow-up suggestions (3 sugerencias contextuales)
  - ✅ Confidence scoring (similarity + query enhancement)

**⚠️ IMPORTANTE**: Durante desarrollo, consultar `plan.md` para especificaciones completas de arquitectura, API contracts, y database schema del nuevo sistema.