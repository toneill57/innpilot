import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star, MessageSquare, ThumbsUp, Send } from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  context_count?: number
  performance?: {
    total_time_ms: number
    cache_hit?: boolean
    filters_applied?: number
    [key: string]: any
  }
  metadata?: {
    category_filter?: string
    location_filter?: string
    [key: string]: any
  }
}

interface ResponseRatingProps {
  message: Message
  userQuestion?: string
  userSession?: string
}

export function ResponseRating({ message, userQuestion, userSession }: ResponseRatingProps) {
  const [rating, setRating] = useState<number | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleRate = async (value: number) => {
    if (isSubmitted) return

    setRating(value)

    // Auto-submit for ratings 4-5, show feedback form for 1-3
    if (value >= 4) {
      await submitFeedback(value)
    } else {
      setShowFeedbackForm(true)
    }
  }

  const submitFeedback = async (ratingValue: number = rating!, feedbackTextValue: string = feedbackText) => {
    if (isSubmitting || isSubmitted) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/muva/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId: message.id,
          rating: ratingValue,
          feedbackText: feedbackTextValue.trim() || undefined,
          question: userQuestion,
          responsePreview: message.content,
          category: message.metadata?.category_filter,
          location: message.metadata?.location_filter,
          filtersUsed: {
            category: message.metadata?.category_filter,
            location: message.metadata?.location_filter,
            // Add other filters from metadata
          },
          responseTimeMs: message.performance?.total_time_ms,
          userSession
        }),
      })

      if (response.ok) {
        setIsSubmitted(true)
        setShowFeedbackForm(false)
        console.log('Feedback submitted successfully')
      } else {
        console.error('Failed to submit feedback')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitFeedback = () => {
    if (rating) {
      submitFeedback(rating, feedbackText)
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex items-center gap-2 mt-2 text-xs text-green-600">
        <ThumbsUp className="w-3 h-3" />
        <span>¡Gracias por tu feedback!</span>
      </div>
    )
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Rating stars */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">¿Te fue útil?</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRate(star)}
              disabled={isSubmitting}
              className={`transition-colors hover:scale-110 transform ${
                rating && rating >= star
                  ? 'text-yellow-500'
                  : 'text-gray-300 hover:text-yellow-400'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Star className="w-3 h-3 fill-current" />
            </button>
          ))}
        </div>
      </div>

      {/* Feedback form for low ratings */}
      {showFeedbackForm && rating && rating <= 3 && (
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              ¿Cómo podemos mejorar?
            </span>
          </div>
          <Textarea
            placeholder="Cuéntanos qué información te faltó o cómo podríamos haber sido más útiles..."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            className="text-sm min-h-[60px] resize-none"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {feedbackText.length}/500 caracteres
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFeedbackForm(false)}
                className="text-xs h-7"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitFeedback}
                disabled={isSubmitting}
                className="text-xs h-7"
              >
                {isSubmitting ? (
                  'Enviando...'
                ) : (
                  <>
                    <Send className="w-3 h-3 mr-1" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick feedback form for moderate ratings */}
      {showFeedbackForm && rating && rating === 4 && (
        <div className="p-2 bg-blue-50 rounded border">
          <Textarea
            placeholder="¿Algo más que te gustaría agregar? (opcional)"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            className="text-sm min-h-[40px] resize-none"
            maxLength={300}
          />
          <div className="flex justify-end mt-2">
            <Button
              size="sm"
              onClick={handleSubmitFeedback}
              disabled={isSubmitting}
              className="text-xs h-6"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResponseRating