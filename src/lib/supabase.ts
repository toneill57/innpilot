import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface DocumentEmbedding {
  id: string
  content: string
  embedding: number[]
  metadata: Record<string, unknown>
  created_at: string
}

export async function searchDocuments(
  queryEmbedding: number[],
  matchThreshold: number = 0.8,
  matchCount: number = 1
): Promise<DocumentEmbedding[]> {
  // Fallback: get all documents and do similarity search manually
  // This is not optimal but will work for now
  const { data, error } = await supabase
    .from('document_embeddings')
    .select('*')
    .limit(20) // Optimized limit for faster queries

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