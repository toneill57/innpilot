# InnPilot Performance Optimization Plan

## 🎯 Goal: Reduce Chat Response Time
**Current**: 4.77s → **Target**: <600ms (87% improvement)

## 📊 Current Performance Analysis
- **OpenAI Embeddings**: ~200-500ms
- **Supabase Query**: ~100-400ms
- **Anthropic Claude**: ~2-4s ⚠️ **MAIN BOTTLENECK**
- **Network (Colombia↔US)**: ~200-500ms

---

## 🚀 Phase 1: Quick Wins (Target: <1.5s)
**Expected Impact**: 70-80% improvement | **Timeline**: 1-2 hours

### ✅ Task 1.1: Upgrade Claude Model
**Impact**: -50-70% Claude response time (3-4s → 1-1.5s)

```bash
# Update environment variable
CLAUDE_MODEL=claude-3-5-haiku-20241022  # vs claude-3-haiku-20240307
```

**Files to update**:
- `.env.local`
- Vercel environment variables

### ✅ Task 1.2: Reduce Token Limit
**Impact**: -20-30% Claude response time

```bash
# Update environment variable
CLAUDE_MAX_TOKENS=250  # vs 500 current
```

### ✅ Task 1.3: Optimize Search Parameters
**Impact**: -30-40% total response time

**File**: `src/lib/supabase.ts`
```typescript
// Current vs Optimized
matchCount: number = 1        // vs 2 current
.limit(20)                   // vs 50 current
matchThreshold: number = 0.8 // vs 0.7 current
```

**Success Metric**: Response time <1.5s

---

## 🎯 Phase 2: Caching (Target: <600ms)
**Expected Impact**: 40-60% improvement | **Timeline**: 2-3 hours

### ✅ Task 2.1: Install Vercel KV
```bash
npm install @vercel/kv
```

### ✅ Task 2.2: Implement Response Cache
**Impact**: ~90% faster for cached responses (4s → 50ms)

**File**: `src/app/api/chat/route.ts`
```typescript
import { kv } from '@vercel/kv'

// Cache strategy
const cacheKey = `chat:${hashQuestion(question)}`
const cached = await kv.get(cacheKey)
if (cached) return NextResponse.json(cached)

// After getting response
await kv.set(cacheKey, response, { ex: 3600 }) // 1 hour TTL
```

### ✅ Task 2.3: Cache Common Embeddings
**Impact**: -200-300ms for frequent questions

**File**: `src/lib/openai.ts`
```typescript
const embeddingCache = new Map<string, number[]>()

// Common SIRE questions cache
const commonQuestions = [
  "¿Cuáles son los pasos para reportar al SIRE?",
  "¿Qué documentos necesito para el SIRE?",
  "¿Cuándo debo reportar al SIRE?"
]
```

**Success Metric**: Response time <600ms for 80% of queries

---

## ⚡ Phase 3: Advanced Optimizations (Target: <300ms)
**Expected Impact**: 20-40% improvement | **Timeline**: 4-6 hours

### ✅ Task 3.1: Create Native Supabase Function
**Impact**: -100-200ms for similarity search

**SQL**: Execute in Supabase SQL Editor
```sql
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(3072),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 1
)
RETURNS TABLE(
  id uuid,
  content text,
  embedding vector(3072),
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.embedding,
    (d.embedding <#> query_embedding) * -1 AS similarity
  FROM document_embeddings d
  WHERE (d.embedding <#> query_embedding) * -1 > match_threshold
  ORDER BY d.embedding <#> query_embedding
  LIMIT match_count;
END;
$$;
```

### ✅ Task 3.2: Implement Streaming Response
**Impact**: Better perceived performance

**File**: `src/app/api/chat/route.ts`
```typescript
// Streaming implementation
const stream = new ReadableStream({
  start(controller) {
    // Stream response chunks
  }
})

return new Response(stream, {
  headers: { 'Content-Type': 'text/plain; charset=utf-8' }
})
```

### ✅ Task 3.3: Parallel Processing
**Impact**: -200-400ms by running operations concurrently

```typescript
// Execute in parallel
const [embedding, preContext] = await Promise.all([
  generateEmbedding(question),
  getFrequentlyUsedContext() // Pre-loaded context
])
```

### ✅ Task 3.4: Document Pre-processing
**Impact**: Smaller context = faster Claude responses

**Strategy**:
- Create document summaries (max 200 chars)
- Remove redundant information
- Pre-compute embeddings for summaries

**Success Metric**: Response time <300ms for 90% of queries

---

## 📈 Implementation Priority

### Week 1: Foundation
- [ ] Phase 1: All quick wins
- [ ] Test and measure improvements
- [ ] Document results

### Week 2: Caching
- [ ] Phase 2: Implement caching layer
- [ ] A/B test cache strategies
- [ ] Monitor cache hit rates

### Week 3: Advanced
- [ ] Phase 3: Advanced optimizations
- [ ] Performance monitoring dashboard
- [ ] Load testing from Colombia

---

## 🔧 Testing Strategy

### Performance Benchmarks
```bash
# Test command
time curl -X POST https://innpilot.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"¿Cuáles son los 7 pasos oficiales para reportar información al SIRE?"}'

# Success criteria by phase:
# Phase 1: <1.5s (current: 4.77s)
# Phase 2: <600ms
# Phase 3: <300ms
```

### Monitoring
- [ ] Add response time logging
- [ ] Implement health checks with timing
- [ ] Set up Vercel Analytics
- [ ] Monitor from Colombia IP

---

## 🎯 Success Metrics

| Phase | Target Time | Improvement | Status |
|-------|-------------|-------------|---------|
| Baseline | 4.77s | - | ✅ |
| Phase 1 | <1.5s | 69% | ⏳ |
| Phase 2 | <600ms | 87% | ⏳ |
| Phase 3 | <300ms | 94% | ⏳ |

---

## 🚨 Risk Mitigation

### Potential Issues
1. **Cache invalidation**: TTL strategy + manual refresh
2. **Memory usage**: Monitor Vercel limits
3. **Accuracy trade-offs**: A/B test response quality
4. **Cold starts**: Implement warming strategy

### Rollback Plan
- Keep original implementation as fallback
- Feature flags for each optimization
- Gradual rollout strategy

---

## 💡 Additional Ideas (Future)

### Long-term Optimizations
- [ ] **Edge Functions**: Move to Cloudflare Workers (closer to Colombia)
- [ ] **CDN Caching**: Cache static responses at edge
- [ ] **Database Optimization**: Dedicated Supabase instance
- [ ] **Model Fine-tuning**: Train smaller model on SIRE data
- [ ] **Preload Strategy**: Warm cache with common questions
- [ ] **User Context**: Personalized cache based on hotel type

### Monitoring & Analytics
- [ ] Real User Monitoring (RUM)
- [ ] Error tracking with Sentry
- [ ] Performance dashboard
- [ ] User satisfaction metrics

---

*Last updated: 2025-09-18*
*Target completion: Phase 1-2 within 1 week*