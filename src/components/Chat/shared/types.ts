export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: Array<{
    type: 'accommodation' | 'tourism'
    name: string
    similarity: number
  }>
  performance?: {
    responseTime: number
    tier: string
    resultsCount: number
  }
}

export interface PremiumChatInterfaceProps {
  clientId: string
  businessName: string
}

export interface SuggestionCategory {
  category: string
  icon: any
  color: string
  questions: string[]
}