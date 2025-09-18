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

# Testing APIs locally
curl http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"question":"¿Qué es el SIRE?"}'
```

## Architecture

### Frontend Components
- **Dashboard**: Main interface with tabbed navigation (upload, chat, reports)
- **FileUploader**: Drag-and-drop SIRE file validation with real-time feedback
- **ChatAssistant**: AI-powered chat interface for SIRE questions
- **UI Components**: Custom shadcn/ui components (Button, Card, Input)

### API Routes (Edge Runtime)
- `GET/POST /api/chat` - Chat assistant with context retrieval
- `POST /api/validate` - File validation for SIRE format
- `GET /api/health` - Health check with service status

### Data Flow
1. User asks SIRE question → Generate OpenAI embeddings
2. Search Supabase for relevant context → match_documents()
3. Send context + question to Claude → Generate response
4. Target: <600ms response time from Colombia

## Environment Variables

Required in `.env.local`:
```
SUPABASE_URL=https://ooaumjzaztmutltifhoq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-proj-ipB48deRibaLRwMy8QwErL3hw_woS8iQ...
ANTHROPIC_API_KEY=sk-ant-api03-MvQDTIR4rVe1srvytlNAc3M6sg02g9W...
CLAUDE_MODEL=claude-3-haiku-20240307
CLAUDE_MAX_TOKENS=250
```

## SIRE Validation Rules

The platform validates Colombian hotel guest registry files:
- **Format**: .txt files with TAB-separated values
- **Fields**: Exactly 13 mandatory fields per record
- **Valid Document Types**: 3 (Cédula), 5 (Pasaporte), 46 (Visa), 10 (PTP)
- **Max File Size**: 10MB

## Database Schema (Supabase)

```sql
-- Main embeddings table (already exists)
document_embeddings (
  id uuid PRIMARY KEY,
  content text,
  embedding vector(3072),
  metadata jsonb,
  created_at timestamp
)

-- Search function (already implemented)
match_documents(query_embedding, similarity_threshold, match_count)
```

## Deploy Configuration

- **Platform**: Vercel
- **Region**: US East (iad1) for optimal Colombia latency
- **Runtime**: Edge functions for API routes
- **Framework**: Auto-detected Next.js

Deploy: `vercel --prod` or GitHub auto-deploy