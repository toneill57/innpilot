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

# Performance & Optimization
npm run test-performance  # Compare localhost vs production performance
npm run setup-pgvector   # Setup pgvector function (after manual SQL)

# API Integration (Recommended Method)
## Use JavaScript/fetch for all integrations:

// Production API calls
const healthCheck = await fetch('https://innpilot.vercel.app/api/health')
  .then(res => res.json());

const chatResponse = await fetch('https://innpilot.vercel.app/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: "¿Cuáles son los 7 pasos oficiales para reportar información al SIRE?"
  })
}).then(res => res.json());

## cURL Examples (debugging/testing only)
# Production
curl https://innpilot.vercel.app/api/health
curl -X POST https://innpilot.vercel.app/api/chat -H "Content-Type: application/json" -d '{"question":"¿Cuáles son los 7 pasos oficiales para reportar información al SIRE?"}'

# Local development
curl http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"question":"¿Cuáles son las 13 especificaciones de campos obligatorios?"}'
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

### Vector Search Implementation
- **Current**: Manual cosine similarity calculation in JavaScript (~3s response time both environments)
- **Optimized**: pgvector `match_documents()` function available in `/sql/match_documents_function.sql`
- **Performance Gap**: Localhost 25% slower than production (3.3s vs 2.7s) - both need pgvector
- **Critical**: Implement pgvector for 85% performance improvement (see `PGVECTOR_IMPLEMENTATION.md`)

### Data Flow
1. User question → OpenAI embeddings → Supabase vector search
2. Retrieved context + question → Claude response
3. **Enhanced Cache**: Semantic grouping + memory cache
   - Cache hits: ~15ms (localhost) vs ~130ms (production)
   - Fresh requests: ~3.3s (localhost) vs ~2.7s (production) - **NEEDS pgvector**

## Environment Variables

Required in `.env.local`:
```
SUPABASE_URL=https://ooaumjzaztmutltifhoq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-proj-ipB48deRibaLRwMy8QwErL3hw_woS8iQ...
ANTHROPIC_API_KEY=sk-ant-api03-MvQDTIR4rVe1srvytlNAc3M6sg02g9W...
CLAUDE_MODEL=claude-3-5-haiku-20241022
CLAUDE_MAX_TOKENS=800
```

## SIRE Validation Rules

The platform validates Colombian hotel guest registry files:
- **Format**: .txt files with TAB-separated values
- **Fields**: Exactly 13 mandatory fields per record
- **Valid Document Types**: 3 (Cédula), 5 (Pasaporte), 46 (Visa), 10 (PTP)
- **Max File Size**: 10MB

## Database Schema (Supabase)

`document_embeddings` table with vector(3072) embeddings. Currently using manual cosine similarity (pgvector native function pending).

## Document Chunking Strategy

Uses LangChain RecursiveCharacterTextSplitter with 1000 char chunks, 100 char overlap.
Configuration in `src/lib/chunking.ts`. Results: 9 chunks (68% reduction from 28).


## Deploy & Production URLs

- **Platform**: Vercel US East (iad1)
- **Production**: https://innpilot.vercel.app
- **API Endpoints**: `/api/health`, `/api/chat`, `/api/validate`
- **Deploy**: `vercel --prod` or GitHub auto-deploy