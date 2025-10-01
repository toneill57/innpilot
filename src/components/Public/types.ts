/**
 * Type definitions for Public Chat components
 */

export interface TravelIntent {
  check_in_date?: string
  check_out_date?: string
  num_guests?: number
  accommodation_type?: string
}

export interface MessageSource {
  unit_name?: string
  title?: string
  photos?: string[]
  content?: string
  type?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: MessageSource[]
  travel_intent?: TravelIntent
  availability_url?: string
  suggestions?: string[]
}

export interface PublicChatResponse {
  success: boolean
  data?: {
    session_id: string
    response: string
    sources: MessageSource[]
    travel_intent: TravelIntent
    availability_url?: string
    suggestions: string[]
  }
  error?: {
    code: string
    message: string
  }
}

export interface Photo {
  url: string
  caption?: string
}
