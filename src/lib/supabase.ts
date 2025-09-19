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
  // Metadata fields from documentation template frontmatter
  title?: string
  description?: string
  category?: string
  status?: string
  version?: string
  last_updated?: string
  tags?: string[]
  keywords?: string[]
  language?: string
  embedding_model?: string
  metadata?: Record<string, unknown> // Generic metadata field
  created_at: string
}

export async function searchDocuments(
  queryEmbedding: number[],
  matchThreshold: number = 0.3,
  matchCount: number = 4
): Promise<DocumentEmbedding[]> {
  console.log('🧪 Testing pgvector function with embedding length:', queryEmbedding.length)

  // Validate inputs
  if (!queryEmbedding || queryEmbedding.length === 0) {
    throw new Error('Query embedding is empty or invalid')
  }

  if (queryEmbedding.length !== 3072) {
    console.warn(`⚠️ Unexpected embedding dimension: ${queryEmbedding.length} (expected 3072)`)
  }

  // Try native pgvector function with retry logic
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      // Add timeout to the request (30 seconds)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const { data, error } = await supabase
        .rpc('match_documents', {
          query_embedding: queryEmbedding,
          match_threshold: matchThreshold,
          match_count: matchCount
        })
        .abortSignal(controller.signal)

      clearTimeout(timeoutId)

      console.log(`🔍 pgvector call result - Error: ${!!error} Data: ${!!data} Data length: ${data?.length || 0}`)

      if (error) {
        // Handle specific error types
        if (error.code === 'PGRST202') {
          console.warn(`⚠️ Attempt ${attempt}/3: pgvector function not in schema cache, retrying...`)
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 150 * Math.pow(2, attempt - 1))) // Exponential backoff
            continue
          }
        } else if (error.code === 'PGRST001') {
          console.error('❌ Database connection failed')
        } else if (error.code === 'PGRST116') {
          console.error('❌ Supabase function timeout')
        }

        console.error('❌ pgvector search failed:', error)
        throw new Error(`Vector search failed: ${error.message}. Code: ${error.code || 'unknown'}`)
      }

      if (!data) {
        console.log('⚠️ No results from pgvector search')
        return []
      }

      console.log(`✅ Using native vector search function - Found results: ${data.length}`)

      // Validate and map results to DocumentEmbedding interface
      const validatedResults = data
        .filter((doc: unknown) => doc && typeof doc === 'object' && 'id' in doc && 'content' in doc)
        .map((doc: {
          id: string;
          content: string;
          source_file: string;
          document_type: string;
          chunk_index: number;
          total_chunks: number;
          created_at: string;
          similarity: number;
        }) => ({
          ...doc,
          embedding: [], // Don't return embeddings to save bandwidth
          metadata: { similarity: doc.similarity } // Include similarity in metadata
        }))

      return validatedResults

    } catch (err) {
      console.error(`❌ Attempt ${attempt}/3 failed:`, err)

      // Don't retry on non-retryable errors
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          console.error('❌ Request timeout')
        } else if (err.message.includes('NetworkError')) {
          console.error('❌ Network connectivity issue')
        }
      }

      if (attempt === 3) {
        throw new Error(`pgvector search failed after ${attempt} attempts: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }

      // Progressive backoff: 150ms, 300ms, 600ms
      await new Promise(resolve => setTimeout(resolve, 150 * Math.pow(2, attempt - 1)))
    }
  }

  // This should never be reached, but TypeScript requires it
  return []
}