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

INSTRUCCIONES DE FORMATO:
- Responde de manera útil, precisa y concisa sobre gestión SIRE, validaciones, y procedimientos hoteleros
- Usa formato Markdown para mejorar la legibilidad:
  * **Negritas** para términos importantes
  * Listas numeradas para procedimientos paso a paso
  * Listas con viñetas para elementos o características
  * \`código\` para códigos específicos (ej: tipo documento "3", campos, etc.)
- Estructura la información de forma clara y organizada
- Si no tienes información suficiente en el contexto, indica que necesitas más detalles específicos

Responde en español y con formato Markdown apropiado.`

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