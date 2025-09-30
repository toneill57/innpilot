/**
 * Unit tests for Conversational Chat Engine
 */

import {
  extractEntities,
  generateFollowUpSuggestions,
  type ChatMessage,
  type VectorSearchResult,
} from '../conversational-chat-engine'

describe('Conversational Chat Engine', () => {
  describe('extractEntities', () => {
    it('should extract entities from message history', () => {
      const history: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Quiero bucear',
          entities: ['buceo', 'Blue Life Dive'],
          created_at: '2025-09-30T10:00:00Z',
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Blue Life Dive es excelente',
          entities: ['Blue Life Dive'],
          created_at: '2025-09-30T10:00:05Z',
        },
      ]

      const entities = extractEntities(history)

      expect(entities).toContain('buceo')
      expect(entities).toContain('Blue Life Dive')
    })

    it('should deduplicate entities', () => {
      const history: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Test 1',
          entities: ['buceo', 'playa'],
          created_at: '2025-09-30T10:00:00Z',
        },
        {
          id: '2',
          role: 'user',
          content: 'Test 2',
          entities: ['buceo', 'snorkel'],
          created_at: '2025-09-30T10:00:05Z',
        },
      ]

      const entities = extractEntities(history)

      // Should only have "buceo" once
      expect(entities.filter((e) => e === 'buceo')).toHaveLength(1)
    })

    it('should handle messages without entities field', () => {
      const history: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Pregunta sin metadata',
          created_at: '2025-09-30T10:00:00Z',
        },
      ]

      const entities = extractEntities(history)

      // Should return empty array (no entities field)
      expect(entities).toEqual([])
    })

    it('should return empty array for empty history', () => {
      const entities = extractEntities([])
      expect(entities).toEqual([])
    })
  })

  describe('generateFollowUpSuggestions', () => {
    const mockVectorResults: VectorSearchResult[] = [
      {
        content: 'Blue Life Dive - Escuela de buceo',
        similarity: 0.85,
        table: 'muva_content',
        title: 'Blue Life Dive',
        source_file: 'blue-life-dive.md',
      },
    ]

    it('should suggest related entity questions', () => {
      const response = 'Blue Life Dive ofrece certificaciones PADI'
      const entities = ['Blue Life Dive', 'buceo']

      const suggestions = generateFollowUpSuggestions(response, entities, mockVectorResults)

      // Should generate 3 suggestions
      expect(suggestions.length).toBe(3)
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should suggest tourism-specific questions for tourism results', () => {
      const response = 'Información sobre buceo'
      const entities = ['buceo']

      const suggestions = generateFollowUpSuggestions(response, entities, mockVectorResults)

      // Should suggest tourism-related questions
      expect(
        suggestions.some((s) => s.includes('llego') || s.includes('horario') || s.includes('contacto'))
      ).toBe(true)
    })

    it('should suggest accommodation-specific questions for accommodation results', () => {
      const accommodationResults: VectorSearchResult[] = [
        {
          content: 'Suite con vista al mar',
          similarity: 0.9,
          table: 'accommodation_units',
          name: 'Suite Premium',
        },
      ]

      const response = 'Tenemos suites disponibles'
      const entities = ['suite']

      const suggestions = generateFollowUpSuggestions(response, entities, accommodationResults)

      // Should suggest accommodation-related questions
      expect(
        suggestions.some((s) => s.includes('actividades') || s.includes('restaurantes') || s.includes('cerca'))
      ).toBe(true)
    })

    it('should return exactly 3 suggestions', () => {
      const response = 'Test response'
      const entities = ['test']

      const suggestions = generateFollowUpSuggestions(response, entities, mockVectorResults)

      expect(suggestions).toHaveLength(3)
    })

    it('should return unique suggestions', () => {
      const response = 'Test response'
      const entities = ['test']

      const suggestions = generateFollowUpSuggestions(response, entities, mockVectorResults)

      const uniqueSuggestions = Array.from(new Set(suggestions))
      expect(suggestions.length).toBe(uniqueSuggestions.length)
    })

    it('should provide fallback generic suggestions', () => {
      const response = 'Test'
      const entities: string[] = []

      const suggestions = generateFollowUpSuggestions(response, entities, [])

      // Should have generic suggestions
      expect(suggestions.length).toBe(3)
      expect(
        suggestions.some((s) => s.includes('playa') || s.includes('bucear') || s.includes('restaurantes'))
      ).toBe(true)
    })
  })

  describe('VectorSearchResult type validation', () => {
    it('should accept valid accommodation result', () => {
      const result: VectorSearchResult = {
        id: '123',
        name: 'Suite Premium',
        content: 'Beautiful suite with ocean view',
        similarity: 0.92,
        table: 'accommodation_units',
        view_type: 'ocean',
      }

      expect(result.table).toBe('accommodation_units')
      expect(result.name).toBe('Suite Premium')
    })

    it('should accept valid tourism result', () => {
      const result: VectorSearchResult = {
        title: 'Blue Life Dive',
        source_file: 'blue-life-dive.md',
        content: 'PADI certified dive school',
        description: 'Professional diving courses',
        similarity: 0.88,
        table: 'muva_content',
        business_info: {
          telefono: '+57 300 123 4567',
          precio: 'Desde $150.000',
        },
      }

      expect(result.table).toBe('muva_content')
      expect(result.business_info).toBeDefined()
    })
  })
})
