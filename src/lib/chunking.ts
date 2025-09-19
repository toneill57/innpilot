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

// Optimized configuration for SIRE documentation - balanced approach
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

  constructor(config: ChunkConfig = DEFAULT_CHUNK_CONFIG) {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
      separators: config.separators || DEFAULT_CHUNK_CONFIG.separators
    })
  }

  async chunkDocument(
    content: string,
    source: string,
    additionalMetadata: Record<string, unknown> = {}
  ): Promise<DocumentChunk[]> {
    // Create LangChain document
    const doc = new Document({
      pageContent: content,
      metadata: { source, ...additionalMetadata }
    })

    // Split into semantic chunks
    const chunks = await this.splitter.splitDocuments([doc])

    // Convert to our format with proper metadata
    return chunks.map((chunk, index) => ({
      content: chunk.pageContent,
      metadata: {
        source,
        chunkIndex: index,
        totalChunks: chunks.length,
        chunkSize: DEFAULT_CHUNK_CONFIG.chunkSize,
        overlapSize: DEFAULT_CHUNK_CONFIG.chunkOverlap,
        ...chunk.metadata,
        ...additionalMetadata
      }
    }))
  }

  // Quick test method to preview chunking results
  async previewChunks(content: string): Promise<string[]> {
    const doc = new Document({ pageContent: content })
    const chunks = await this.splitter.splitDocuments([doc])
    return chunks.map((chunk, i) =>
      `Chunk ${i + 1} (${chunk.pageContent.length} chars): ${chunk.pageContent.substring(0, 100)}...`
    )
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