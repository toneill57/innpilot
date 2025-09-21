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

// Optimized configuration for SIRE and MUVA - enhanced semantic validation with hierarchy
const DEFAULT_CHUNK_CONFIG: ChunkConfig = {
  chunkSize: 1000,       // Standard chunk size for optimal context
  chunkOverlap: 100,     // 10% overlap for context preservation
  separators: [
    '\n## ',             // Markdown h2 headers (highest priority)
    '\n### ',            // Markdown h3 headers
    '\n#### ',           // Markdown h4 headers
    '\n\n',              // Paragraph breaks (very important)
    '\n',                // Line breaks
    '. ',                // Sentence endings (critical for semantic integrity)
    '! ',                // Exclamation sentences
    '? ',                // Question sentences
    '; ',                // Semicolon breaks
    ', ',                // Comma breaks
    ' ',                 // Word breaks (important - never cut words)
    ''                   // Character breaks (absolute fallback)
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
    if (splitPoint <= 0 || splitPoint >= text.length) return true

    const prevChar = text[splitPoint - 1]
    const nextChar = text[splitPoint]

    // CRITICAL: Never split in the middle of a word (alphanumeric characters)
    if (/\w/.test(prevChar) && /\w/.test(nextChar)) {
      return false
    }

    // Avoid splitting within numbers with decimals/commas
    if (/\d/.test(prevChar) && /[.,]/.test(nextChar)) {
      return false
    }
    if (/[.,]/.test(prevChar) && /\d/.test(nextChar)) {
      return false
    }

    // Expand context window for better detection
    const contextStart = Math.max(0, splitPoint - 50)
    const contextEnd = Math.min(text.length, splitPoint + 50)
    const context = text.substring(contextStart, contextEnd)

    // Avoid splitting inside URLs, emails, or code blocks
    if (context.includes('http://') || context.includes('https://') ||
        context.includes('@') || context.includes('```') ||
        context.includes('`') || context.includes('www.')) {
      return false
    }

    // Avoid splitting inside markdown links or images
    if (context.includes('](') || context.includes('![')) {
      return false
    }

    return true
  }

  /**
   * Post-process chunks to ensure semantic integrity and fix boundary issues
   */
  private validateChunks(chunks: string[]): string[] {
    return chunks
      .filter(chunk => chunk.trim().length >= 50) // Filter very small chunks
      .map(chunk => {
        let processed = chunk.trim()

        // Fix chunks that end mid-word (more aggressive approach)
        while (/\w$/.test(processed) && processed.length > 100) {
          const lastSpace = processed.lastIndexOf(' ')
          const lastPunctuation = Math.max(
            processed.lastIndexOf('.'),
            processed.lastIndexOf('!'),
            processed.lastIndexOf('?'),
            processed.lastIndexOf(';')
          )

          // Prefer cutting at punctuation, otherwise at space
          const cutPoint = lastPunctuation > lastSpace ? lastPunctuation + 1 : lastSpace

          if (cutPoint > processed.length * 0.7) { // Don't cut too much
            processed = processed.substring(0, cutPoint).trim()
          } else {
            break // Avoid infinite loop if no good cut point
          }
        }

        // Fix chunks that start with incomplete sentences or lowercase
        if (processed.match(/^[a-z]/) && !processed.match(/^(a|an|the|and|or|but|in|on|at|to|for|of|with|by)\s/i)) {
          // Look for a better starting point (sentence beginning)
          const sentenceStart = processed.match(/[.!?]\s+[A-Z]/)
          if (sentenceStart && sentenceStart.index !== undefined && sentenceStart.index < processed.length * 0.3) {
            const betterStart = sentenceStart.index + sentenceStart[0].length - 1
            processed = processed.substring(betterStart).trim()
          }
        }

        // Remove orphaned punctuation at the beginning
        processed = processed.replace(/^[,;:]\s*/, '')

        // Ensure we don't end with incomplete punctuation patterns
        processed = processed.replace(/\s+[,;:]$/, '')

        return processed
      })
      .filter(chunk => chunk.length >= 50) // Re-filter after processing
      .filter(chunk => chunk.trim().length > 0) // Remove empty chunks
  }

  /**
   * Enhanced chunking with semantic validation
   */
  private async chunkWithValidation(content: string): Promise<string[]> {
    // Use LangChain's splitter as base
    const doc = new Document({ pageContent: content })
    const langchainChunks = await this.splitter.splitDocuments([doc])
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
    const chunks = await this.chunkWithValidation(content)

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
    const chunks = await this.chunkWithValidation(content)
    return chunks.map((chunk, i) =>
      `Chunk ${i + 1} (${chunk.length} chars, validated): ${chunk.substring(0, 100)}${chunk.length > 100 ? '...' : ''}`
    )
  }

  /**
   * Analyze chunk quality metrics
   */
  async analyzeChunkQuality(content: string): Promise<{
    totalChunks: number
    avgChunkSize: number
    minChunkSize: number
    maxChunkSize: number
    chunksWithValidStart: number
    chunksWithValidEnd: number
    qualityScore: number
  }> {
    const chunks = await this.chunkWithValidation(content)

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

// Simple chunk function that returns just the text chunks (for scripts)
export async function chunkText(
  content: string,
  chunkSize: number = 1000,
  overlap: number = 100
): Promise<string[]> {
  const chunker = new SemanticChunker({
    chunkSize,
    chunkOverlap: overlap,
    separators: DEFAULT_CHUNK_CONFIG.separators
  })

  const chunks = await chunker.chunkWithValidation(content)
  return chunks
}

// Direct access to the config for advanced usage
export { DEFAULT_CHUNK_CONFIG }