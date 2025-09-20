'use client'

// MUVA Tourism Assistant Component
// Specialized chat interface for tourism queries about San Andrés and Colombian destinations

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, MapPin, Star, DollarSign, Clock, Send, MessageCircle, Filter } from 'lucide-react'
import { getMuvaCategories, getPriceRanges, type MuvaCategory, type PriceRange } from '@/lib/muva-utils'

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
        metadata: data.metadata
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('MUVA Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Disculpa, hubo un error procesando tu consulta turística. Por favor intenta nuevamente.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearFilters = () => {
    setFilters({})
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '')

  // Suggested tourism questions
  const suggestions = [
    "¿Cuáles son los mejores restaurantes de San Andrés?",
    "¿Qué playas recomiendas para snorkeling?",
    "¿Dónde puedo comprar artesanías locales?",
    "¿Qué actividades hay para hacer en familia?",
    "¿Cuáles son los mejores hoteles boutique?",
    "¿Dónde está la mejor vida nocturna?"
  ]

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Asistente MUVA</h2>
            <p className="text-sm text-gray-600">Guía turística de San Andrés y destinos colombianos</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filtros
          {hasActiveFilters && (
            <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-xs">
              {Object.values(filters).filter(v => v !== undefined && v !== '').length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Limpiar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoría</label>
                <Select
                  value={filters.category || ''}
                  onValueChange={(value) => setFilters(prev => ({
                    ...prev,
                    category: value as MuvaCategory || undefined
                  }))}
                >
                  <SelectTrigger>
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
                <label className="text-sm font-medium">Ubicación</label>
                <Input
                  placeholder="San Andrés, Centro, etc."
                  value={filters.location || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    location: e.target.value || undefined
                  }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Calificación mínima</label>
                <Select
                  value={filters.min_rating?.toString() || ''}
                  onValueChange={(value) => setFilters(prev => ({
                    ...prev,
                    min_rating: value ? parseFloat(value) : undefined
                  }))}
                >
                  <SelectTrigger>
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
                <label className="text-sm font-medium">Rango de precio</label>
                <Select
                  value={filters.price_range || ''}
                  onValueChange={(value) => setFilters(prev => ({
                    ...prev,
                    price_range: value as PriceRange || undefined
                  }))}
                >
                  <SelectTrigger>
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
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="prose prose-sm max-w-none">
                  {message.content.split('\n').map((line, index) => (
                    <p key={index} className="mb-1 last:mb-0">
                      {line}
                    </p>
                  ))}
                </div>

                {message.type === 'assistant' && message.metadata && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                      {message.context_count !== undefined && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {message.context_count} resultados
                        </span>
                      )}
                      {message.performance && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {message.performance.total_time_ms}ms
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">MUVA está buscando información turística...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Suggestions */}
        {messages.length <= 1 && !isLoading && (
          <div className="px-4 pb-4">
            <div className="text-sm text-gray-600 mb-2">Preguntas sugeridas:</div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setInputValue(suggestion)}
                  className="text-xs h-8"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Pregúntame sobre turismo en San Andrés..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !inputValue.trim()}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}