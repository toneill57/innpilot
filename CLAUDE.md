# CLAUDE.md

InnPilot is a SIRE compliance platform for Colombian hotels with AI chat assistant and file validation.

## Tech Stack
- Next.js 14 + TypeScript + Tailwind CSS
- Supabase (PostgreSQL + pgvector)
- OpenAI embeddings + Anthropic Claude
- Deployed on Vercel US East

## Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
```

## API Testing
```bash
node -e "fetch('http://localhost:3000/api/health').then(res => res.json()).then(console.log)"
node -e "fetch('http://localhost:3000/api/chat', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({question: '¿Cuáles son los 13 campos obligatorios del SIRE?'})}).then(res => res.json()).then(data => console.log('Status:', data.performance ? 'SUCCESS' : 'ERROR', '- Time:', data.performance?.total_time_ms + 'ms'))"
```

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

## Database Schema
- `document_embeddings`: SIRE documents with pgvector embeddings
- `muva_embeddings`: Tourism data with pgvector embeddings
- Both use text-embedding-3-large model (3072 dimensions)

## Performance
- pgvector search: 300-600ms
- Chat endpoint: 3-5s (fresh) / cache hits <1s
- Chunking: 1000 chars, 100 overlap

## MCP Integration ✅
Supabase MCP configured in user scope. Use `mcp__supabase__*` tools for database operations.

## Delegación de Embeddings ⚡
**NUNCA ejecutes directamente scripts de embeddings**. SIEMPRE delega al agente embedder-inspect usando Task tool cuando:
- El usuario pida subir/procesar embeddings
- Haya errores relacionados con embeddings/chunking
- Se necesite diagnóstico de calidad de chunks
- Se reporten problemas de cortes en palabras
- Se requiera re-procesar documentos

El agente embedder-inspect es PROACTIVO y actuará automáticamente para resolver estos temas.

## Scripts de Embeddings
- `scripts/populate-embeddings.js` - Script principal
- `scripts/inspect-embeddings.js` - Diagnóstico

## Deploy Agent 🤖
- `npm run deploy-agent` - Commit automático + deploy + verificación
- `npm run deploy-agent:verbose` - Modo detallado con logs completos

El Deploy Agent:
1. Analiza cambios automáticamente
2. Crea commits descriptivos
3. Push a GitHub
4. Monitorea deploy en Vercel
5. Verifica endpoints funcionando
6. Reporta status completo

## Nota sobre unified-embeddings.js
NO usar `scripts/unified-embeddings.js` - está deprecado

## Production
- URL: https://innpilot.vercel.app
- Deploy: `vercel --prod` or auto-deploy from GitHub