import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function generateChatResponse(
  question: string,
  context: string
): Promise<string> {
  const model = process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307'
  const maxTokens = parseInt(process.env.CLAUDE_MAX_TOKENS || '250')

  const prompt = `Eres un asistente especializado en el SIRE (Sistema de Información y Registro de Extranjeros) de Colombia para hoteles.

Contexto relevante:
${context}

Pregunta del usuario: ${question}

Responde de manera útil, precisa y concisa sobre gestión SIRE, validaciones, y procedimientos hoteleros. Si no tienes información suficiente en el contexto, indica que necesitas más detalles específicos.`

  const message = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature: 0.1,
    top_k: 4,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  })

  if (message.content[0].type === 'text') {
    return message.content[0].text
  }

  throw new Error('Error generating response from Claude')
}

export { anthropic }