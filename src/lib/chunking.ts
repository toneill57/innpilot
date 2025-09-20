import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { Document } from 'langchain/document'

export interface ChunkConfig {
  chunkSize: number
  chunkOverlap: number
  separators?: string[]
}

export interface DocumentChunk {
  content: string
  metadata: {
    source: string
    chunkIndex: number
    totalChunks: number
    chunkSize: number
    overlapSize: number
  }
}

// Optimized configuration for SIRE documentation - balanced approach with semantic validation
const DEFAULT_CHUNK_CONFIG: ChunkConfig = {
  chunkSize: 1000,       // Larger chunks for better context and fewer embeddings
  chunkOverlap: 100,     // 10% overlap for context preservation
  separators: [
    '\n## ',             // Markdown h2 headers (main sections only)
    '\n\n',              // Paragraph breaks
    '\n',                // Line breaks
    ' ',                 // Word breaks
    ''                   // Character breaks (fallback)
  ]
}

export class SemanticChunker {
  private splitter: RecursiveCharacterTextSplitter
  private config: ChunkConfig

  constructor(config: ChunkConfig = DEFAULT_CHUNK_CONFIG) {
    this.config = config
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
      separators: config.separators || DEFAULT_CHUNK_CONFIG.separators
    })
  }

  /**
   * Validates that a split point doesn't break words or important semantic boundaries
   */
  private isValidSplitPoint(text: string, splitPoint: number): boolean {
    // Don't split in the middle of a word
    if (splitPoint > 0 && splitPoint < text.length) {
      const prevChar = text[splitPoint - 1]
      const nextChar = text[splitPoint]

      // Avoid splitting between alphanumeric characters (middle of word)
      if (/\w/.test(prevChar) && /\w/.test(nextChar)) {
        return false
      }

      // Avoid splitting inside URLs or code blocks
      const context = text.substring(Math.max(0, splitPoint - 20), Math.min(text.length, splitPoint + 20))
      if (context.includes('http') || context.includes('```') || context.includes('`')) {
        return false
      }
    }
    return true
  }

  /**
   * Post-process chunks to ensure semantic integrity
   */
  private validateChunks(chunks: string[]): string[] {
    return chunks
      .filter(chunk => chunk.trim().length >= 50) // Filter very small chunks
      .map(chunk => {
        const trimmed = chunk.trim()

        // Ensure chunks don't end mid-word (basic heuristic)
        if (/\w$/.test(trimmed) && trimmed.length >= this.config.chunkSize * 0.8) {
          const lastSpace = trimmed.lastIndexOf(' ')
          if (lastSpace > trimmed.length * 0.8) {
            return trimmed.substring(0, lastSpace)
          }
        }

        // Ensure chunks don't start with incomplete sentences
        if (trimmed.match(/^[a-z]/)) {
          const firstPeriod = trimmed.indexOf('. ')
          if (firstPeriod > 0 && firstPeriod < trimmed.length * 0.2) {
            return trimmed.substring(firstPeriod + 2)
          }
        }

        return trimmed
      })
      .filter(chunk => chunk.length >= 50) // Re-filter after processing
  }

  /**
   * Enhanced chunking with semantic validation
   */
  private chunkWithValidation(content: string): string[] {
    // Use LangChain's splitter as base
    const doc = new Document({ pageContent: content })
    const langchainChunks = this.splitter.splitDocuments([doc])
    const chunks = langchainChunks.map(chunk => chunk.pageContent)

    // Apply semantic validation
    return this.validateChunks(chunks)
  }

  async chunkDocument(
    content: string,
    source: string,
    additionalMetadata: Record<string, unknown> = {}
  ): Promise<DocumentChunk[]> {
    // Use enhanced chunking with semantic validation
    const chunks = this.chunkWithValidation(content)

    // Convert to our format with proper metadata
    return chunks.map((chunk, index) => ({
      content: chunk,
      metadata: {
        source,
        chunkIndex: index,
        totalChunks: chunks.length,
        chunkSize: this.config.chunkSize,
        overlapSize: this.config.chunkOverlap,
        ...additionalMetadata,
        // Add quality metrics
        actualChunkSize: chunk.length,
        hasValidStart: !chunk.match(/^[a-z]/),
        hasValidEnd: !chunk.match(/\w$/),
        semanticallyValidated: true
      }
    }))
  }

  // Quick test method to preview chunking results with validation
  async previewChunks(content: string): Promise<string[]> {
    const chunks = this.chunkWithValidation(content)
    return chunks.map((chunk, i) =>
      `Chunk ${i + 1} (${chunk.length} chars, validated): ${chunk.substring(0, 100)}${chunk.length > 100 ? '...' : ''}`
    )
  }

  /**
   * Analyze chunk quality metrics
   */
  analyzeChunkQuality(content: string): {
    totalChunks: number
    avgChunkSize: number
    minChunkSize: number
    maxChunkSize: number
    chunksWithValidStart: number
    chunksWithValidEnd: number
    qualityScore: number
  } {
    const chunks = this.chunkWithValidation(content)

    const sizes = chunks.map(chunk => chunk.length)
    const validStarts = chunks.filter(chunk => !chunk.match(/^[a-z]/)).length
    const validEnds = chunks.filter(chunk => !chunk.match(/\w$/)).length

    return {
      totalChunks: chunks.length,
      avgChunkSize: Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length),
      minChunkSize: Math.min(...sizes),
      maxChunkSize: Math.max(...sizes),
      chunksWithValidStart: validStarts,
      chunksWithValidEnd: validEnds,
      qualityScore: Math.round(((validStarts + validEnds) / (chunks.length * 2)) * 100)
    }
  }
}

// Export singleton instance with default config
export const semanticChunker = new SemanticChunker()

// Helper function for backward compatibility
export async function splitIntoSemanticChunks(
  content: string,
  source: string = 'unknown'
): Promise<DocumentChunk[]> {
  return semanticChunker.chunkDocument(content, source)
}