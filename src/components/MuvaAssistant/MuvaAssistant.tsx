'use client'

// MUVA Tourism Assistant Component
// Specialized chat interface for tourism queries about San Andrés and Colombian destinations

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, MapPin, Star, DollarSign, Clock, Send, MessageCircle, Filter, Copy, Share, RefreshCw, Trash2, Download } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { getMuvaCategories, getPriceRanges, type MuvaCategory, type PriceRange } from '@/lib/muva-utils'
import ResponseRating from './ResponseRating'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  context_count?: number
  performance?: {
    total_time_ms: number
    embedding_time_ms: number
    search_time_ms: number
    claude_time_ms: number
  }
  metadata?: {
    category_filter?: string
    location_filter?: string
    results_found: number
    search_strategy: string
  }
}

interface MuvaFilters {
  category?: MuvaCategory
  location?: string
  city?: string
  min_rating?: number
  price_range?: PriceRange
}

export default function MuvaAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<MuvaFilters>({})
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)
  const [userSession] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(2)}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const categories = getMuvaCategories()
  const priceRanges = getPriceRanges()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        type: 'assistant',
        content: `¡Hola! 🏝️ Soy **MUVA**, tu asistente turístico especializado en **San Andrés, Providencia y destinos colombianos**.

Te puedo ayudar con:

🍽️ **Restaurantes** - Las mejores opciones gastronómicas
🎯 **Atracciones** - Lugares imperdibles para visitar
🏖️ **Playas** - Las playas más hermosas y actividades
🎪 **Actividades** - Experiencias únicas y aventuras
🏨 **Hoteles** - Recomendaciones de alojamiento
🌙 **Vida Nocturna** - Bares, discotecas y entretenimiento
🛍️ **Compras** - Mercados y tiendas locales
🚗 **Transporte** - Cómo moverse por la isla

**Ejemplos de preguntas:**
- "¿Cuáles son los mejores restaurantes de mariscos en San Andrés?"
- "¿Qué playas recomiendas para bucear?"
- "¿Dónde puedo comprar artesanías locales?"
- "¿Qué actividades hay para hacer en familia?"

¿En qué te puedo ayudar hoy? 😊`,
        timestamp: new Date()
      }])
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/muva/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage.content,
          ...filters
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error en la consulta turística')
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        context_count: data.context_count,
        performance: data.performance,
        metadata: {
          ...data.metadata,
          search_query: userMessage.content // Store search query for highlighting
        }
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('MUVA Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Disculpa, hubo un error procesando tu consulta turística. Por favor intenta nuevamente.

💡 **Sugerencias para mejorar tu búsqueda:**
- Sé más específico: "restaurantes de mariscos en San Andrés"
- Usa palabras clave: "playas para bucear", "hoteles económicos"
- Pregunta por categorías: "actividades familiares", "vida nocturna"

¿Te gustaría probar con una de las preguntas sugeridas?`,
        timestamp: new Date(),
        metadata: {
          search_strategy: 'error',
          search_query: inputValue,
          results_found: 0
        }
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearFilters = () => {
    setFilters({})
  }

  // Message actions
  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const shareMessage = async (message: Message) => {
    const shareText = `MUVA Tourism Assistant - ${message.type === 'user' ? 'Question' : 'Answer'}:\n\n${message.content}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'MUVA Tourism Assistant',
          text: shareText
        })
      } else {
        await navigator.clipboard.writeText(shareText)
        alert('Mensaje copiado al portapapeles')
      }
    } catch (err) {
      console.error('Failed to share message: ', err)
    }
  }

  const regenerateResponse = async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1 || messageIndex === 0) return

    const userMessage = messages[messageIndex - 1]
    if (userMessage.type !== 'user') return

    setRegeneratingId(messageId)

    try {
      const response = await fetch('/api/muva/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage.content,
          ...filters
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const newMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: data.answer,
          timestamp: new Date(),
          context_count: data.context_count,
          performance: data.performance,
          metadata: {
            ...data.metadata,
            search_query: userMessage.content // Store search query for highlighting
          }
        }

        // Replace the old assistant message with the new one
        setMessages(prev => [
          ...prev.slice(0, messageIndex),
          newMessage,
          ...prev.slice(messageIndex + 1)
        ])
      }
    } catch (error) {
      console.error('Failed to regenerate response:', error)
    } finally {
      setRegeneratingId(null)
    }
  }

  const clearConversation = () => {
    setMessages([])
    // Re-add welcome message
    setTimeout(() => {
      setMessages([{
        id: '1',
        type: 'assistant',
        content: `¡Hola! 🏝️ Soy **MUVA**, tu asistente turístico especializado en **San Andrés, Providencia y destinos colombianos**.

Te puedo ayudar con:

🍽️ **Restaurantes** - Las mejores opciones gastronómicas
🎯 **Atracciones** - Lugares imperdibles para visitar
🏖️ **Playas** - Las playas más hermosas y actividades
🎪 **Actividades** - Experiencias únicas y aventuras
🏨 **Hoteles** - Recomendaciones de alojamiento
🌙 **Vida Nocturna** - Bares, discotecas y entretenimiento
🛍️ **Compras** - Mercados y tiendas locales
🚗 **Transporte** - Cómo moverse por la isla

**Ejemplos de preguntas:**
- "¿Cuáles son los mejores restaurantes de mariscos en San Andrés?"
- "¿Qué playas recomiendas para bucear?"
- "¿Dónde puedo comprar artesanías locales?"
- "¿Qué actividades hay para hacer en familia?"

¿En qué te puedo ayudar hoy? 😊`,
        timestamp: new Date()
      }])
    }, 100)
  }

  const exportConversation = () => {
    const conversationData = {
      timestamp: new Date().toISOString(),
      service: 'MUVA Tourism Assistant',
      messages: messages.map(m => ({
        role: m.type,
        content: m.content,
        timestamp: m.timestamp,
        performance: m.performance,
        metadata: m.metadata
      }))
    }

    const dataStr = JSON.stringify(conversationData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `muva-chat-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '')

  // Category styling helpers
  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      'mejores_restaurantes': '🍽️',
      'playas_actividades': '🏖️',
      'vida_nocturna': '🌙',
      'transporte': '🚗',
      'alojamiento': '🏨',
      'compras': '🛍️'
    }
    return icons[category] || '📍'
  }

  const getCategoryStyle = (category: string): string => {
    const styles: Record<string, string> = {
      'mejores_restaurantes': 'category-restaurant',
      'playas_actividades': 'category-beach',
      'vida_nocturna': 'category-nightlife',
      'transporte': 'category-transport',
      'alojamiento': 'category-hotel',
      'compras': 'category-shopping'
    }
    return styles[category] || 'bg-gray-100 text-gray-700'
  }

  // Enhanced suggested tourism questions with examples
  const suggestions = [
    {
      text: "¿Cuáles son los mejores restaurantes de San Andrés?",
      category: "restaurant",
      description: "Encuentra opciones gastronómicas locales"
    },
    {
      text: "¿Qué playas recomiendas para snorkeling?",
      category: "beach",
      description: "Descubre las mejores playas para bucear"
    },
    {
      text: "¿Dónde puedo comprar artesanías locales?",
      category: "shopping",
      description: "Mercados y tiendas de souvenirs"
    },
    {
      text: "¿Qué actividades hay para hacer en familia?",
      category: "activity",
      description: "Diversión para toda la familia"
    },
    {
      text: "smoothies en San Andrés",
      category: "restaurant",
      description: "Ejemplo: búsqueda por nombre directo"
    },
    {
      text: "lugares pet friendly",
      category: "activity",
      description: "Ejemplo: búsqueda por etiquetas/tags"
    }
  ]

  return (
    <div
      className="flex flex-col h-full max-w-4xl mx-auto"
      role="region"
      aria-label="Asistente turístico MUVA"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between mb-6"
        role="banner"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center"
            aria-label="Logo de MUVA"
          >
            <MessageCircle className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h2
              className="text-2xl font-bold tropical-gradient-text"
              id="muva-title"
            >
              Asistente MUVA
            </h2>
            <p className="text-sm text-gray-600">Guía turística de San Andrés y destinos colombianos</p>
          </div>
        </div>
        <div className="flex items-center gap-2" role="toolbar" aria-label="Acciones del asistente turístico">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
            aria-label={showFilters ? "Ocultar filtros" : "Mostrar filtros"}
            aria-expanded={showFilters}
          >
            <Filter className="w-4 h-4" aria-hidden="true" />
            Filtros
            {hasActiveFilters && (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-xs">
                {Object.values(filters).filter(v => v !== undefined && v !== '').length}
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportConversation}
            className="flex items-center gap-2"
            disabled={messages.length <= 1}
            aria-label="Exportar conversación"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearConversation}
            className="flex items-center gap-2"
            disabled={messages.length <= 1}
            aria-label="Limpiar conversación"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Limpiar
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card
          className="mb-4"
          role="region"
          aria-label="Panel de filtros de búsqueda"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  aria-label="Limpiar todos los filtros"
                >
                  Limpiar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="category-filter">Categoría</label>
                <Select
                  value={filters.category || ''}
                  onValueChange={(value) => setFilters(prev => ({
                    ...prev,
                    category: value as MuvaCategory || undefined
                  }))}
                >
                  <SelectTrigger
                    id="category-filter"
                    aria-label="Seleccionar categoría"
                  >
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las categorías</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="location-filter">Ubicación</label>
                <Input
                  id="location-filter"
                  placeholder="San Andrés, Centro, etc."
                  value={filters.location || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    location: e.target.value || undefined
                  }))}
                  aria-label="Filtrar por ubicación"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="rating-filter">Calificación mínima</label>
                <Select
                  value={filters.min_rating?.toString() || ''}
                  onValueChange={(value) => setFilters(prev => ({
                    ...prev,
                    min_rating: value ? parseFloat(value) : undefined
                  }))}
                >
                  <SelectTrigger
                    id="rating-filter"
                    aria-label="Seleccionar calificación mínima"
                  >
                    <SelectValue placeholder="Cualquier calificación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Cualquier calificación</SelectItem>
                    <SelectItem value="4">4+ estrellas</SelectItem>
                    <SelectItem value="3.5">3.5+ estrellas</SelectItem>
                    <SelectItem value="3">3+ estrellas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="price-filter">Rango de precio</label>
                <Select
                  value={filters.price_range || ''}
                  onValueChange={(value) => setFilters(prev => ({
                    ...prev,
                    price_range: value as PriceRange || undefined
                  }))}
                >
                  <SelectTrigger
                    id="price-filter"
                    aria-label="Seleccionar rango de precio"
                  >
                    <SelectValue placeholder="Cualquier precio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Cualquier precio</SelectItem>
                    {priceRanges.map(range => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      <Card className="flex-1 flex flex-col">
        <CardContent
          className="flex-1 overflow-y-auto p-4 space-y-4"
          role="main"
          aria-live="polite"
          aria-label="Mensajes del chat turístico"
        >
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} group ${
                message.type === 'user' ? 'message-enter-user' : 'message-enter-assistant'
              }`}
              role="article"
              aria-label={`Mensaje de ${message.type === 'user' ? 'usuario' : 'asistente turístico'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 relative ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {/* Message Actions */}
                <div
                  className="absolute -top-2 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  role="toolbar"
                  aria-label="Acciones del mensaje"
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 bg-white shadow-sm hover:bg-gray-50"
                    onClick={() => copyToClipboard(message.content, message.id)}
                    aria-label="Copiar mensaje"
                  >
                    {copiedMessageId === message.id ? (
                      <span className="text-xs text-green-600" aria-label="Copiado">✓</span>
                    ) : (
                      <Copy className="w-3 h-3 text-gray-600" aria-hidden="true" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 bg-white shadow-sm hover:bg-gray-50"
                    onClick={() => shareMessage(message)}
                    aria-label="Compartir mensaje"
                  >
                    <Share className="w-3 h-3 text-gray-600" aria-hidden="true" />
                  </Button>
                  {message.type === 'assistant' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 bg-white shadow-sm hover:bg-gray-50"
                      onClick={() => regenerateResponse(message.id)}
                      disabled={regeneratingId === message.id}
                      aria-label="Regenerar respuesta"
                    >
                      {regeneratingId === message.id ? (
                        <Loader2 className="w-3 h-3 text-gray-600 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3 text-gray-600" />
                      )}
                    </Button>
                  )}
                </div>

                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      // Tourism-themed custom components
                      h1: ({ children }) => (
                        <h1 className="font-bold text-xl mb-3 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="font-semibold text-lg mb-2 text-blue-700 border-b border-blue-200 pb-1">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="font-medium text-base mb-2 text-green-700">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-2 last:mb-0 leading-relaxed text-gray-700">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-none mb-3 space-y-2">
                          {children}
                        </ul>
                      ),
                      li: ({ children }) => (
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1 flex-shrink-0">🌴</span>
                          <span className="flex-1">{children}</span>
                        </li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-blue-600">
                          {children}
                        </strong>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-green-400 bg-green-50 pl-4 py-2 my-3 italic text-gray-600 rounded-r">
                          <span className="mr-2">💡</span>
                          {children}
                        </blockquote>
                      ),
                      code: ({ children }) => (
                        <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-mono">
                          {children}
                        </code>
                      ),
                      // Custom handling for tourism emojis and formatting
                      text: ({ value }) => {
                        // Enhanced emoji rendering for tourism content
                        if (typeof value === 'string') {
                          return value
                        }
                        return value
                      }
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>

                {message.type === 'assistant' && message.metadata && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                    {/* Search Strategy Badge */}
                    {message.metadata.search_strategy && (
                      <div className="mb-2">
                        <Badge
                          className={`metadata-search-badge text-xs font-medium ${
                            message.metadata.search_strategy.includes('vector_search')
                              ? 'bg-blue-100 text-blue-700 border-blue-200'
                              : message.metadata.search_strategy.includes('metadata_search')
                              ? 'bg-purple-100 text-purple-700 border-purple-200'
                              : message.metadata.search_strategy === 'non_tourism_question'
                              ? 'bg-gray-100 text-gray-700 border-gray-200'
                              : 'bg-amber-100 text-amber-700 border-amber-200'
                          }`}
                        >
                          {message.metadata.search_strategy.includes('vector_search') && '🧠 Búsqueda Semántica'}
                          {message.metadata.search_strategy.includes('metadata_search') && '🏷️ Búsqueda por Metadatos'}
                          {message.metadata.search_strategy === 'non_tourism_question' && '❓ Pregunta No Turística'}
                          {message.metadata.search_strategy === 'fallback_response' && '🔍 Respuesta General'}
                          {message.metadata.search_strategy === 'error_fallback' && '⚠️ Respuesta de Error'}
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-center gap-4 flex-wrap">
                      {message.context_count !== undefined && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {message.context_count} resultados
                        </span>
                      )}
                      {message.performance && (
                        <>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {message.performance.total_time_ms}ms
                          </span>
                          {message.performance.cache_hit && (
                            <span className="text-green-600">💾 Desde caché</span>
                          )}
                          {message.performance.filters_applied && message.performance.filters_applied > 0 && (
                            <span className="flex items-center gap-1">
                              <Filter className="w-3 h-3" />
                              {message.performance.filters_applied} filtros
                            </span>
                          )}
                          {message.performance.result_quality && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              Calidad: {(message.performance.result_quality * 100).toFixed(0)}%
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    {message.performance?.semantic_group && (
                      <div className="mt-1">
                        <Badge
                          className={`text-xs border-0 ${getCategoryStyle(message.performance.semantic_group)}`}
                        >
                          {getCategoryIcon(message.performance.semantic_group)} {message.performance.semantic_group.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* Response Rating for assistant messages */}
                {message.type === 'assistant' && (
                  <ResponseRating
                    message={message}
                    userQuestion={messages[messages.findIndex(m => m.id === message.id) - 1]?.content}
                    userSession={userSession}
                  />
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div
              className="flex justify-start message-enter-assistant"
              role="status"
              aria-live="polite"
              aria-label="El asistente turístico está buscando información"
            >
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-3 muva-loading">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-sm text-gray-700 font-medium">
                    🏝️ MUVA está procesando tu consulta...
                  </span>
                </div>
                <div className="text-xs text-gray-600 ml-6 space-y-1">
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                    <span>Analizando tu pregunta turística</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <span>Buscando lugares y actividades relevantes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    <span>Preparando recomendaciones personalizadas</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Enhanced Suggestions with Examples */}
        {messages.length <= 1 && !isLoading && (
          <div
            className="px-4 pb-4"
            role="region"
            aria-label="Preguntas sugeridas con ejemplos"
          >
            <div className="text-sm text-gray-600 mb-3">💡 Prueba estas consultas:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => setInputValue(suggestion.text)}
                  className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all tourism-card group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">
                      {getCategoryIcon(suggestion.category)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                        {suggestion.text}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {suggestion.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t p-4">
          <form
            onSubmit={handleSubmit}
            className="flex gap-2"
            role="search"
            aria-labelledby="muva-title"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Pregúntame sobre turismo en San Andrés..."
              disabled={isLoading}
              className="flex-1"
              aria-label="Escriba su pregunta sobre turismo"
            />
            <Button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              aria-label={isLoading ? "Enviando pregunta..." : "Enviar pregunta"}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="w-4 h-4" aria-hidden="true" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}