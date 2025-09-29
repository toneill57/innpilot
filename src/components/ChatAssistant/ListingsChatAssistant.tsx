'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Send, MessageCircle, Building2, MapPin, Loader2 } from "lucide-react"

interface ListingsChatAssistantProps {
  clientId: string
  businessType: string
  businessName: string
  hasMuvaAccess?: boolean
}

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: string[]
}

interface ChatResponse {
  response: string
  context_used: boolean
  question: string
  filters: {
    client_id: string | null
    business_type: string | null
  }
  performance: {
    total_time_ms: number
    cache_hit: boolean
    environment: string
    timestamp: string
    endpoint: string
  }
}

const SUGGESTED_QUESTIONS = [
  "¿Qué servicios ofrece nuestro negocio?",
  "¿Qué actividades turísticas hay cerca?",
  "¿Cuáles son nuestros horarios de atención?",
  "¿Qué restaurantes recomiendan cerca del hotel?"
]

export function ListingsChatAssistant({ clientId, businessType, businessName, hasMuvaAccess = false }: ListingsChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async (question: string) => {
    if (!question.trim() || isLoading) return

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsLoading(true)

    try {
      console.log(`🚀 Sending listings chat request for client: ${clientId}`)

      const response = await fetch('/api/chat/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          client_id: clientId,
          business_type: businessType
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ChatResponse = await response.json()

      console.log('📊 Full response data:', data)
      console.log(`✅ Response received in ${data.performance?.total_time_ms || 0}ms`)
      console.log(`📊 Context used: ${data.context_used || false}`)

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response || 'No se pudo obtener respuesta',
        timestamp: new Date(),
        sources: []
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('❌ Chat error:', error)

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Lo siento, ocurrió un error al procesar tu consulta. Por favor intenta de nuevo.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(currentMessage)
  }

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question)
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'tenant':
        return <Building2 className="h-3 w-3" />
      case 'muva':
        return <MapPin className="h-3 w-3" />
      default:
        return <MessageCircle className="h-3 w-3" />
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'tenant':
        return businessName
      case 'muva':
        return 'MUVA Turismo'
      default:
        return source.toUpperCase()
    }
  }

  return (
    <div className="space-y-4">
      {/* Business Info Header */}
      <div className="bg-blue-50 p-4 rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-blue-900">{businessName}</h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {businessType}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {hasMuvaAccess ? (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>Plan Premium</span>
              </span>
            ) : (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                Plan Basic
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-blue-700">
          {hasMuvaAccess
            ? "Este asistente combina información específica de tu negocio con datos turísticos de San Andrés (MUVA)"
            : "Este asistente responde sobre tu negocio. ¡Upgrade a Premium para incluir datos turísticos de San Andrés!"
          }
        </p>
        {!hasMuvaAccess && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            💡 <strong>Upgrade a Premium:</strong> Accede a información turística completa de San Andrés (restaurantes, actividades, atracciones)
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <MessageCircle className="mx-auto h-8 w-8 text-gray-400 mb-4" />
            <p className="text-gray-500">¡Hola! Pregúntame sobre tu negocio o turismo en San Andrés</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card className={`max-w-[80%] ${
              message.type === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-50'
            }`}>
              <CardContent className="p-4">
                <div className="prose prose-sm max-w-none">
                  {message.type === 'user' ? (
                    <p className="text-white">{message.content}</p>
                  ) : (
                    <div
                      className="text-gray-800"
                      dangerouslySetInnerHTML={{
                        __html: (message.content || '').replace(/\n/g, '<br/>')
                      }}
                    />
                  )}
                </div>

                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      {message.sources.map((source) => (
                        <span
                          key={source}
                          className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full"
                        >
                          {getSourceIcon(source)}
                          <span>{getSourceLabel(source)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-gray-600">Buscando información...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Suggested Questions */}
      {messages.length === 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Preguntas sugeridas:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {SUGGESTED_QUESTIONS.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestedQuestion(question)}
                disabled={isLoading}
                className="text-left justify-start h-auto p-3 text-sm"
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          placeholder="Escribe tu pregunta..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={!currentMessage.trim() || isLoading}
          size="sm"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  )
}