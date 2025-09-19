import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface DocumentEmbedding {
  id: string
  content: string
  embedding: number[]
  source_file: string
  document_type: string
  chunk_index: number
  total_chunks: number
  metadata?: Record<string, unknown>
  created_at: string
}

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
      console.log('Using native vector search function')
      return nativeData.map((doc: { id: string; content: string; embedding?: number[]; metadata?: unknown; source_file?: string }) => ({
        ...doc,
        embedding: [], // Don't return embedding to save bandwidth
        source_file: doc.source_file || '',
        document_type: doc.document_type || '',
        chunk_index: doc.chunk_index || 0,
        total_chunks: doc.total_chunks || 1,
        metadata: doc.metadata || {},
        created_at: doc.created_at || new Date().toISOString()
      }))
    }

    console.log('Native function not available, falling back to manual search')
  } catch (e) {
    console.log('Native function error, falling back to manual search:', e)
  }

  // Fallback: get all documents and do similarity search manually
  // This is not optimal but will work for now
  const { data, error } = await supabase
    .from('document_embeddings')
    .select('*')
    .limit(50) // Increased limit for better chunked document coverage

  if (error) {
    console.error('Error searching documents:', error)
    throw error
  }

  if (!data || data.length === 0) {
    return []
  }

  // Calculate cosine similarity manually (simple approximation)
  const similarities = data.map(doc => {
    if (!doc.embedding) return { ...doc, similarity: 0 }

    // Parse embedding if it's stored as string
    let docEmbedding = doc.embedding
    if (typeof docEmbedding === 'string') {
      try {
        docEmbedding = JSON.parse(docEmbedding)
      } catch (e) {
        console.error('Error parsing embedding:', e)
        return { ...doc, similarity: 0 }
      }
    }

    if (!Array.isArray(docEmbedding)) {
      console.error('Embedding is not an array:', typeof docEmbedding)
      return { ...doc, similarity: 0 }
    }

    let dotProduct = 0
    let queryMagnitude = 0
    let docMagnitude = 0

    for (let i = 0; i < Math.min(queryEmbedding.length, docEmbedding.length); i++) {
      dotProduct += queryEmbedding[i] * docEmbedding[i]
      queryMagnitude += queryEmbedding[i] * queryEmbedding[i]
      docMagnitude += docEmbedding[i] * docEmbedding[i]
    }

    queryMagnitude = Math.sqrt(queryMagnitude)
    docMagnitude = Math.sqrt(docMagnitude)

    const similarity = dotProduct / (queryMagnitude * docMagnitude)

    return { ...doc, similarity }
  })

  // Filter by threshold and sort by similarity
  return similarities
    .filter(doc => doc.similarity >= matchThreshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, matchCount)
}