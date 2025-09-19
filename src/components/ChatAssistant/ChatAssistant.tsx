'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Send, Bot, User, Loader2, Copy, Share, Trash2, RefreshCw } from "lucide-react"
import ReactMarkdown from 'react-markdown'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isMarkdown?: boolean
}

interface SuggestionCategory {
  title: string
  questions: string[]
}

const QUESTION_SUGGESTIONS: SuggestionCategory[] = [
  {
    title: "📄 Documentos",
    questions: [
      "¿Qué tipos de documentos válidos acepta el SIRE?",
      "¿Cuál es la diferencia entre cédula de extranjería y pasaporte?",
      "¿Qué hago si un huésped tiene visa de turista?"
    ]
  },
  {
    title: "📋 Procedimientos",
    questions: [
      "¿Cuáles son los 7 pasos oficiales para reportar información al SIRE?",
      "¿Cómo se genera y envía el archivo TXT?",
      "¿Cuál es el proceso de validación de archivos?"
    ]
  },
  {
    title: "✅ Validaciones",
    questions: [
      "¿Cuáles son las 13 especificaciones de campos obligatorios?",
      "¿Qué errores comunes ocurren en la validación?",
      "¿Cómo corregir errores de formato en fechas?"
    ]
  },
  {
    title: "🏨 Hoteles",
    questions: [
      "¿Qué información específica deben reportar los hoteles?",
      "¿Cómo manejar huéspedes con documentos extranjeros?",
      "¿Cuándo y con qué frecuencia se debe reportar?"
    ]
  }
]

export function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente especializado en SIRE. Puedo ayudarte con dudas sobre procedimientos, validaciones, documentos válidos y cualquier aspecto del registro de extranjeros. ¿En qué puedo asistirte?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Hide suggestions when user starts typing or after first message
  useEffect(() => {
    if (messages.length > 1) {
      setShowSuggestions(false)
    }
  }, [messages])

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const clearConversation = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: '¡Hola! Soy tu asistente especializado en SIRE. Puedo ayudarte con dudas sobre procedimientos, validaciones, documentos válidos y cualquier aspecto del registro de extranjeros. ¿En qué puedo asistirte?',
        timestamp: new Date()
      }
    ])
    setShowSuggestions(true)
  }

  const shareConversation = async () => {
    const conversationText = messages
      .map(msg => `[${msg.role.toUpperCase()}] ${msg.content}`)
      .join('\n\n')

    try {
      await navigator.clipboard.writeText(conversationText)
      alert('Conversación copiada al portapapeles')
    } catch (err) {
      console.error('Failed to share conversation: ', err)
    }
  }

  const handleSuggestionClick = (question: string) => {
    setInput(question)
    setShowSuggestions(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage.content,
          use_context: true,
          max_context_chunks: 4,
          conversation_history: messages.slice(-4).map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Lo siento, no pude generar una respuesta. Por favor, intenta de nuevo.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error en chat:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu consulta. Por favor, verifica tu conexión e intenta de nuevo.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-96 max-w-4xl mx-auto">
      {/* Header with Actions */}
      <div className="flex justify-between items-center p-3 bg-white border-b rounded-t-lg">
        <h3 className="font-medium text-gray-800">Asistente SIRE</h3>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={shareConversation}
            disabled={messages.length <= 1}
          >
            <Share className="w-4 h-4 mr-1" />
            Compartir
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearConversation}
            disabled={messages.length <= 1}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Limpiar
          </Button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}

            <Card className={`max-w-xs lg:max-w-md relative group ${
              message.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-white'
            }`}>
              <CardContent className="p-3">
                {message.role === 'assistant' ? (
                  <div className="text-sm prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{children}</code>,
                        h1: ({ children }) => <h1 className="font-bold text-base mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="font-semibold text-sm mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="font-medium text-sm mb-1">{children}</h3>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
                <div className="flex justify-between items-center mt-2">
                  <p className={`text-xs ${
                    message.role === 'user'
                      ? 'text-blue-100'
                      : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString('es-CO', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  {message.role === 'assistant' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                      onClick={() => copyToClipboard(message.content, message.id)}
                    >
                      {copiedMessageId === message.id ? (
                        <span className="text-xs text-green-600">✓</span>
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <Card className="bg-white">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-500">Escribiendo...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Question Suggestions */}
      {showSuggestions && (
        <div className="p-4 bg-white border-t">
          <p className="text-sm font-medium text-gray-700 mb-3">Preguntas frecuentes:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {QUESTION_SUGGESTIONS.map((category, categoryIndex) => (
              <div key={categoryIndex} className="space-y-2">
                <p className="text-xs font-medium text-gray-600">{category.title}</p>
                <div className="space-y-1">
                  {category.questions.map((question, questionIndex) => (
                    <Button
                      key={questionIndex}
                      variant="ghost"
                      size="sm"
                      className="h-auto p-2 text-left justify-start whitespace-normal text-xs hover:bg-gray-100"
                      onClick={() => handleSuggestionClick(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSuggestions(false)}
              className="w-full"
            >
              Ocultar sugerencias
            </Button>
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t rounded-b-lg">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta sobre SIRE, validaciones, documentos..."
            className="flex-1"
            disabled={isLoading}
            maxLength={500}
          />
          {!showSuggestions && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowSuggestions(true)}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">
            Pregunta sobre procedimientos SIRE, validaciones, documentos válidos, campos obligatorios, etc.
          </p>
          <p className="text-xs text-gray-400">
            {input.length}/500
          </p>
        </div>
      </form>
    </div>
  )
}