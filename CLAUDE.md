# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InnPilot is a modern web platform for managing SIRE compliance for Colombian hotels with **revolutionary Matryoshka embeddings architecture** providing 10x search performance improvement.

**📋 Complete tech stack & commands**: See `SNAPSHOT.md` for detailed architecture stack, dependencies, and all development commands.

## ⚠️ CRITICAL METHODOLOGY OVERRIDE
**NEVER use curl for API testing in this project** - system has curl pre-approved but project requires:
1. **MCP tools (PRIMARY)** - For database operations and SQL queries
2. **fetch() (SECONDARY)** - For API endpoint testing
3. **curl (EMERGENCY ONLY)** - Only when other methods fail

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

**COMANDOS MATRYOSHKA:**
```bash
# Generar embeddings multi-tier para documento
node scripts/populate-embeddings.js documento.md

# Test tier detection automático
curl -X POST http://localhost:3000/api/chat/muva \
  -H "Content-Type: application/json" \
  -d '{"question": "restaurantes en San Andrés"}' # → Tier 1 (1024 dims)

curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "documentos SIRE válidos"}' # → Tier 2 (1536 dims)

# Verificar índices vectoriales
psql -c "SELECT tablename, indexname FROM pg_indexes WHERE indexname LIKE '%embedding%';"
```

**TIER ROUTING STRATEGY:**
- **Tourism/MUVA** → Tier 1: `["restaurantes", "playas", "actividades", "transporte"]`
- **SIRE/Compliance** → Tier 2: `["sire", "campos", "validación", "documento"]`
- **Complex/Fallback** → Tier 3: `default`, large documents, precise matching

## Database Schema - MULTI-TENANT MATRYOSHKA SYSTEM

**Core Architecture:**
- **Multi-tenant isolation**: `sire_content`, `muva_content`, tenant-specific schemas
- **Matryoshka columns**: `embedding` (3072d), `embedding_balanced` (1536d), `embedding_fast` (1024d)
- **Tenant permissions**: `user_tenant_permissions` + `tenant_registry`

**Vector Functions with Tier Routing:**
- `match_sire_documents()` → Tier 2 (1536d) → `/api/chat`
- `match_muva_documents()` → Tier 1 (1024d) → `/api/chat/muva`
- `match_listings_documents()` → Multi-tier → `/api/chat/listings`

**📋 Complete schema details**: See `SNAPSHOT.md` for current data counts, migration guides, and setup instructions.

## System Status & Performance Verification

### **Production-Ready Status:**
- ✅ **Matryoshka performance**: 10x improvement operational
- ✅ **Multi-tenant system**: Fully functional (SIRE + MUVA + tenant-specific)
- ✅ **Authentication**: Operational with optimized RLS
- ✅ **Context retrieval**: 100% functional with 4+ typical results

### **Quick Development Verification:**
```bash
# Test multi-tenant system with performance logging
curl -X POST http://localhost:3000/api/chat/listings \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Qué reglas hay sobre Habibi?", "client_id": "b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf", "business_type": "hotel"}'

# Expected: context_used: true, <50ms response time, tier detection logged
```

**📋 Complete performance metrics**: See `SNAPSHOT.md` system status section and `/api/health` endpoint for detailed monitoring.

## Embeddings

```bash
# Script ÚNICO con MATRYOSHKA EMBEDDINGS (Sept 2025)
node scripts/populate-embeddings.js [archivo.md]
```

**🪆 SISTEMA MATRYOSHKA CONSOLIDADO (Sept 2025)**:
- ✅ **Script ÚNICO**: populate-embeddings.js con capacidades multi-tier automáticas
- ✅ **Embeddings Multi-Tier**: Genera 1024, 1536, Y 3072 dims simultáneamente según tabla destino
- ✅ **Estrategia Auto-Detect**: Tier 1 (tourism), Tier 2 (sire), Tier 3 (complex/fallback)
- ✅ **Índices vectoriales**: 6 índices HNSW creados y funcionando (fast_embedding, balanced_embedding, full_embedding)
- ✅ **API Integration**: Todos los endpoints (/api/chat, /api/chat/muva, /api/chat/listings) usan tier detection
- ✅ **Router Inteligente**: `/src/lib/search-router.ts` con SEARCH_PATTERNS para detección automática
- ✅ **OpenAI Integration**: `generateEmbedding(text, dimensions)` - soporte nativo Matryoshka
- ✅ **Performance Monitoring**: Logging detallado de tier usage y performance metrics
- ✅ **YAML Frontmatter Support**: Metadata integrado directamente en archivos .md
- ✅ **Universal Chunking**: CHUNK_SIZE=1000, OVERLAP=100 para todos los documentos
- ✅ **Multi-domain routing**: Automático a sire_content, muva_content, hotels tables
- ✅ **Test Coverage**: Unit tests actualizados para nuevas function signatures
- ✅ **SISTEMA DE EXTRACCIÓN COMPLETO**: 8 funciones enhanced para extraer TODOS los campos del template
- ✅ **HTML Comments Integration**: Sistema `<!-- EXTRAE: campo -->` para extracción precisa al 100%
- ✅ **25+ Fields Coverage**: accommodation_units, policies, guest_information completamente poblados

**📋 Migration details**: See `SNAPSHOT.md` for complete script consolidation and migration history.

## Critical Issues & Solutions

### **Major Breakthroughs Achieved:**
- ✅ **Vector index 3072-dimension limitation**: SOLVED via Matryoshka multi-tier architecture
- ✅ **Multi-tenant system**: Fully operational (SIRE + MUVA + tenant-specific)
- ✅ **Context retrieval**: 100% functional with 4+ results typical
- ✅ **Performance optimization**: 10x improvement achieved and verified
- ✅ **Campos faltantes loop**: SOLVED completamente - Sistema de extracción con 25+ campos al 100%

### **Common Solutions:**
- **buildManifest.js errors** → Restart: `npm run dev`
- **Development server issues** → Kill process and restart fresh

**📋 Complete troubleshooting**: See `TROUBLESHOOTING.md` for comprehensive issue resolution and `SNAPSHOT.md` for full problem history.

## Deploy & Production

**📋 Complete deployment info**: See `SNAPSHOT.md` for production URLs, deployment commands, and system requirements.

## Agentes Especializados 🤖

### **deploy-agent** 🚀
- **Propósito**: Automatización completa de commits → deploy → verificación de producción

### **ux-interface** 🎨
- **Propósito**: Gestión autónoma de UI/UX, animaciones, estilos y componentes visuales

### **embeddings-generator** 🔍
- **Propósito**: Procesamiento y generación de embeddings para documentos SIRE
- **Activación**: Automática para comandos como "sube archivo", "embediza", "procesa embeddings"

**⚠️ DELEGACIÓN PROACTIVA REQUERIDA**: Claude debe delegar automáticamente a estos agentes sin esperar instrucciones explícitas.

## 🛡️ VSCODE SYNC CONFIGURATION (Sept 2025) ✅

**PROBLEMA RESUELTO**: VSCode buffer conflicts con Claude Code modifications

**CONFIGURACIÓN AUTOMÁTICA IMPLEMENTADA:**
- ✅ **Auto-save cada segundo**: Previene buffers sucios en memoria
- ✅ **Auto-refresh archivos**: Recarga cambios externos automáticamente
- ✅ **Git auto-refresh**: Estado siempre actualizado
- ✅ **Script de verificación**: `scripts/check-file-conflicts.js`

**WORKFLOW RECOMENDADO:**
```bash
# Antes de solicitar modificaciones masivas a Claude:
node scripts/check-file-conflicts.js

# Si hay conflictos, cerrar archivos en VSCode:
# Cmd+K Cmd+W (cerrar todos) o Cmd+W (cerrar actual)

# Verificar que no hay buffers sucios:
# Files → Auto Save debe estar activado
```

**CONFIGURACIÓN CRÍTICA (.vscode/settings.json):**
- `files.autoSave: "afterDelay"` - Guarda automáticamente
- `files.autoSaveDelay: 1000` - Cada segundo
- `workbench.editor.revealIfOpen: true` - Revela cambios
- `git.autorefresh: true` - Git siempre actualizado

**⚠️ SETTINGS GLOBALES REQUERIDOS:**
En tu VSCode global (Cmd+,), configurar:
- `files.hotExit: "off"` - Evita restaurar buffers sucios
- `files.autoSave: "afterDelay"` - Backup global

## Environment Variables

**📋 Complete setup guide**: See `SNAPSHOT.md` configuration section for all required environment variables and setup instructions.

## Documentation System

**📋 Complete documentation index**: See `SNAPSHOT.md` for comprehensive list of 12+ technical guides including:
- Matryoshka Architecture (500+ line technical guide)
- Multi-tenant system documentation
- Troubleshooting guides
- API documentation
- Processing workflows

**Template system**: YAML frontmatter + cross-references fully operational and production-ready.