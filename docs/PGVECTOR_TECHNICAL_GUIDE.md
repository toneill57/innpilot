# 🔧 pgvector Technical Implementation Guide

**Status:** ✅ **IMPLEMENTED & ACTIVE** (January 2025)
**Performance:** 60% improvement in vector search speed
**Deployment:** Live in both localhost and Vercel production

---

## 🏗️ **Architecture Overview**

### **Before pgvector (Manual Search):**
```mermaid
User Query → OpenAI Embedding → Manual Cosine Similarity (~800ms) → Results
```

### **After pgvector (Optimized):**
```mermaid
User Query → OpenAI Embedding → Native pgvector Function (~300ms) → Results
```

---

## 📁 **File Structure**

```
/sql/
├── match_documents_function.sql       # Original pgvector function
└── match_documents_function_fixed.sql # Final working version (no metadata)

/scripts/
├── quick-pgvector-benchmark.js        # Fast performance test
├── benchmark-pgvector-comparison.js   # Detailed analysis
├── setup-vector-function.js           # Setup automation
└── execute-pgvector-sql.js           # SQL execution helper

/src/lib/
├── supabase.ts                        # Auto-detection logic + fallback
└── chunking.ts                        # Document preprocessing

/docs/
├── PGVECTOR_IMPLEMENTATION.md         # Implementation details
├── BENCHMARK_REPORT_PGVECTOR.md       # Performance results
└── PGVECTOR_TECHNICAL_GUIDE.md        # This file
```

---

## ⚙️ **Implementation Details**

### **1. Database Function (Supabase)**

**Location:** `/sql/match_documents_function_fixed.sql`

```sql
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
  created_at timestamptz,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id, content, embedding, source_file, document_type,
    chunk_index, total_chunks, created_at,
    1 - (embedding <=> query_embedding) as similarity
  FROM document_embeddings
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

### **2. Application Integration (TypeScript)**

**Location:** `/src/lib/supabase.ts:25-72`

```typescript
export async function searchDocuments(
  queryEmbedding: number[],
  matchThreshold: number = 0.8,
  matchCount: number = 4
): Promise<DocumentEmbedding[]> {
  try {
    // Try native vector search function first (optimized)
    const { data: nativeData, error: nativeError } = await supabase
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount
      })

    if (!nativeError && nativeData) {
      console.log('✅ Using native vector search function')
      return nativeData.map(transformToDocumentEmbedding)
    }

    console.log('❌ Native function not available, falling back to manual search')
    // Fallback to manual cosine similarity...
  } catch (e) {
    console.log('Native function error, falling back to manual search:', e)
  }

  // Manual search implementation as fallback...
}
```

### **3. Auto-Detection Logic**

The system automatically detects pgvector availability:

1. **Attempts** to call `match_documents()` function
2. **Success**: Uses native pgvector with ~300ms search time
3. **Failure**: Falls back to manual similarity calculation (~800ms)
4. **Logging**: Clear indicators in console for debugging

---

## 📊 **Performance Metrics**

### **Search Component Performance:**

| Method | Time | Improvement |
|--------|------|-------------|
| **Manual cosine similarity** | ~800ms | Baseline |
| **pgvector native function** | ~300ms | **60% faster** |

### **Total Response Time:**

| Environment | Before | After | Improvement |
|-------------|--------|-------|-------------|
| **Localhost** | ~4,500ms | ~4,000ms | ~11% |
| **Vercel** | ~3,300ms | ~3,300ms | Maintained* |

*Vercel was already optimized with infrastructure, gained vector search optimization

---

## 🧪 **Testing & Validation**

### **Quick Status Check:**
```bash
# Should show "✅ Using native vector search function" in logs
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"¿Cuáles son los 13 campos obligatorios del SIRE?"}'
```

### **Performance Benchmarks:**
```bash
# Quick comparison (2-3 minutes)
node scripts/quick-pgvector-benchmark.js

# Detailed analysis (8-10 minutes)
node scripts/benchmark-pgvector-comparison.js
```

### **Expected Log Output:**
```
🧪 Testing pgvector function with embedding length: 3072
🔍 pgvector call result - Error: false Data: true Data length: 4
✅ Using native vector search function - Found results: 4
✅ Found 4 relevant documents - Search time: 309ms
```

---

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **1. "Native function not available"**
**Symptoms:** Logs show fallback to manual search
**Cause:** pgvector function not deployed in Supabase
**Solution:** Execute SQL manually in Supabase Dashboard

#### **2. High search times (>800ms)**
**Symptoms:** Performance degradation
**Cause:** Using manual search fallback
**Fix:** Check Supabase function exists and has correct permissions

#### **3. "different vector dimensions" error**
**Symptoms:** Function call fails
**Cause:** Embedding dimension mismatch
**Fix:** Ensure OpenAI embeddings are 3072 dimensions

#### **4. No context found**
**Symptoms:** `context_used: false` in responses
**Cause:** Query too generic or no relevant documents
**Fix:** Use specific SIRE-related questions for testing

---

## 🔄 **Deployment Process**

### **For New Environments:**

1. **Database Setup:**
   ```sql
   -- Execute in Supabase SQL Editor
   -- Copy content from /sql/match_documents_function_fixed.sql
   ```

2. **Verify Function:**
   ```bash
   # Test function exists
   curl -X POST "https://PROJECT.supabase.co/rest/v1/rpc/match_documents" \
     -H "apikey: YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{"query_embedding": [0.1, 0.2, ...], "match_count": 1}'
   ```

3. **Deploy Application:**
   ```bash
   git add . && git commit -m "feat: pgvector optimization"
   git push origin main  # Auto-deploys to Vercel
   ```

4. **Validate:**
   ```bash
   node scripts/quick-pgvector-benchmark.js
   ```

---

## 🎯 **Key Benefits Achieved**

1. **✅ Performance**: 60% improvement in vector search speed
2. **✅ Reliability**: Automatic fallback ensures zero downtime
3. **✅ Monitoring**: Clear logging for debugging and monitoring
4. **✅ Scalability**: Native database function scales with infrastructure
5. **✅ Maintainability**: Well-documented with automated testing

---

## 📚 **Related Documentation**

- **Implementation**: [`PGVECTOR_IMPLEMENTATION.md`](./PGVECTOR_IMPLEMENTATION.md)
- **Performance Results**: [`BENCHMARK_REPORT_PGVECTOR.md`](./BENCHMARK_REPORT_PGVECTOR.md)
- **Developer Guide**: [`CLAUDE.md`](../CLAUDE.md#pgvector-performance-monitoring)

---

*Last updated: January 19, 2025*
*Status: ✅ Production Ready*