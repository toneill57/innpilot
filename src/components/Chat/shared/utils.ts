import { ChatMessage } from "./types"

/**
 * Scroll to the bottom of the chat messages
 */
export const scrollToBottom = (messagesEndRef: React.RefObject<HTMLDivElement>) => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
}

/**
 * Copy text to clipboard with error handling
 */
export const copyToClipboard = async (text: string, messageId: string, setCopiedMessageId: (id: string | null) => void) => {
  try {
    await navigator.clipboard.writeText(text)
    setCopiedMessageId(messageId)
    setTimeout(() => setCopiedMessageId(null), 2000)
  } catch (err) {
    console.error('Failed to copy text: ', err)
  }
}

/**
 * Share conversation as text
 */
export const shareConversation = async (messages: ChatMessage[], isDevVersion: boolean = false) => {
  const conversationText = messages
    .map(msg => `[${msg.role.toUpperCase()}] ${msg.content}`)
    .join('\n\n')

  try {
    await navigator.clipboard.writeText(conversationText)
    alert(`Conversación copiada al portapapeles${isDevVersion ? ' (versión de desarrollo)' : ''}`)
  } catch (err) {
    console.error('Failed to share conversation: ', err)
  }
}

/**
 * Generate initial welcome message
 */
export const generateWelcomeMessage = (businessName: string, isDevVersion: boolean = false): ChatMessage => {
  const baseContent = `¡Hola! Soy tu asistente premium de **${businessName}**.

Tengo acceso a:
🏨 **Información completa del hotel** (habitaciones, amenidades, políticas)
🌴 **Datos turísticos de San Andrés** (actividades, restaurantes, playas)

Puedo ayudarte con consultas combinadas como "habitación con vista al mar + restaurantes cercanos" o información específica sobre cualquier aspecto. ¿En qué puedo asistirte?`

  const devContent = `🧪 **VERSIÓN DE DESARROLLO** 🧪

¡Hola! Soy tu asistente premium de **${businessName}** (versión testing).

Tengo acceso a:
🏨 **Información completa del hotel** (habitaciones, amenidades, políticas)
🌴 **Datos turísticos de San Andrés** (actividades, restaurantes, playas)

⚠️ **NOTA**: Esta es una versión experimental para pruebas y desarrollo. Los cambios aquí no afectan la versión en producción.

Puedo ayudarte con consultas combinadas como "habitación con vista al mar + restaurantes cercanos" o información específica sobre cualquier aspecto. ¿En qué puedo asistirte?`

  return {
    id: '1',
    role: 'assistant',
    content: isDevVersion ? devContent : baseContent,
    timestamp: new Date()
  }
}

/**
 * Generate error message
 */
export const generateErrorMessage = (isDevVersion: boolean = false): ChatMessage => {
  const baseError = 'Lo siento, hubo un error al procesar tu consulta. Por favor, verifica tu conexión e intenta de nuevo.'
  const devError = '🧪 **[DEV ERROR]** Lo siento, hubo un error al procesar tu consulta en la versión de desarrollo. Por favor, verifica tu conexión e intenta de nuevo.'

  return {
    id: (Date.now() + 1).toString(),
    role: 'assistant',
    content: isDevVersion ? devError : baseError,
    timestamp: new Date()
  }
}

/**
 * Format response content for development version
 */
export const formatDevResponse = (response: string): string => {
  return `🧪 **[DEV]** ${response}`
}

/**
 * Get API endpoint based on version
 */
export const getApiEndpoint = (isDevVersion: boolean): string => {
  return isDevVersion ? '/api/premium-chat-dev' : '/api/premium-chat'
}

/**
 * Environment configuration helpers
 */
export const isDevelopmentEnabled = (): boolean => {
  return process.env.ENABLE_DEV_FEATURES === 'true'
}

export const isDevLoggingEnabled = (): boolean => {
  return process.env.PREMIUM_CHAT_DEV_LOGGING === 'true'
}

export const isDevMetricsEnabled = (): boolean => {
  return process.env.PREMIUM_CHAT_DEV_METRICS === 'true'
}