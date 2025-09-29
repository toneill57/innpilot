import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function generateEmbedding(text: string, dimensions?: number): Promise<number[]> {
  const embeddingConfig: any = {
    model: 'text-embedding-3-large',
    input: text,
    encoding_format: 'float',
  }

  // 🪆 MATRYOSHKA SUPPORT: Add dimensions parameter if specified
  if (dimensions && dimensions !== 3072) {
    embeddingConfig.dimensions = dimensions
  }

  const response = await openai.embeddings.create(embeddingConfig)

  return response.data[0].embedding
}

export { openai }