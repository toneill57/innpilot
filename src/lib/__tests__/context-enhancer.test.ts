/**
 * Unit tests for Context Enhancer
 */

import {
  detectFollowUp,
  extractSimpleEntities,
  extractEntitiesFromHistory,
  buildContextSummary,
} from '../context-enhancer'
import type { ChatMessage } from '../conversational-chat-engine'

describe('Context Enhancer', () => {
  describe('detectFollowUp', () => {
    it('should detect follow-up questions with pronouns', () => {
      expect(detectFollowUp('¿cuánto cuesta eso?')).toBe(true)
      expect(detectFollowUp('¿cómo llego allá?')).toBe(true)
      expect(detectFollowUp('¿qué tal está ese lugar?')).toBe(true)
    })

    it('should detect ambiguous short questions', () => {
      expect(detectFollowUp('¿cuánto cuesta?')).toBe(true)
      expect(detectFollowUp('horario')).toBe(true)
      expect(detectFollowUp('precio')).toBe(true)
    })

    it('should detect relative references', () => {
      expect(detectFollowUp('¿hay otro cerca?')).toBe(true)
      expect(detectFollowUp('¿qué más tiene?')).toBe(true)
      expect(detectFollowUp('¿también hay buceo?')).toBe(true)
    })

    it('should NOT detect standalone questions', () => {
      // These have context/specificity, so should be treated as non-follow-ups
      expect(detectFollowUp('¿Dónde puedo bucear en San Andrés?')).toBe(false)
      expect(detectFollowUp('Quiero información sobre restaurantes')).toBe(false)
    })
  })

  describe('extractSimpleEntities', () => {
    it('should extract proper nouns (multi-word)', () => {
      const text = 'Me gustaría ir a Blue Life Dive para bucear'
      const entities = extractSimpleEntities(text)
      expect(entities).toContain('Blue Life Dive')
    })

    it('should extract Spanish proper nouns', () => {
      const text = 'El Totumasso es un restaurante excelente'
      const entities = extractSimpleEntities(text)
      expect(entities).toContain('El Totumasso')
    })

    it('should extract known tourism keywords', () => {
      const text = 'Quiero hacer buceo y snorkel en la playa'
      const entities = extractSimpleEntities(text)
      expect(entities).toContain('buceo')
      expect(entities).toContain('snorkel')
      expect(entities).toContain('playa')
    })

    it('should deduplicate entities', () => {
      const text = 'buceo buceo buceo'
      const entities = extractSimpleEntities(text)
      expect(entities.filter((e) => e === 'buceo')).toHaveLength(1)
    })

    it('should return empty array for text without entities', () => {
      const text = 'esto es una prueba sin nombres'
      const entities = extractSimpleEntities(text)
      expect(entities).toHaveLength(0)
    })
  })

  describe('extractEntitiesFromHistory', () => {
    const mockHistory: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'Quiero bucear en Blue Life Dive',
        entities: ['Blue Life Dive', 'buceo'],
        created_at: '2025-09-30T10:00:00Z',
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Blue Life Dive ofrece certificaciones de buceo',
        created_at: '2025-09-30T10:00:05Z',
      },
      {
        id: '3',
        role: 'user',
        content: '¿cuánto cuesta?',
        created_at: '2025-09-30T10:00:10Z',
      },
    ]

    it('should extract entities from message metadata', () => {
      const entities = extractEntitiesFromHistory(mockHistory)
      expect(entities).toContain('Blue Life Dive')
      expect(entities).toContain('buceo')
    })

    it('should extract entities from message content when metadata missing', () => {
      const entities = extractEntitiesFromHistory(mockHistory)
      // Should extract from content of messages without entities field
      expect(entities.length).toBeGreaterThan(0)
    })

    it('should limit to last 3 messages', () => {
      const longHistory: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Mensaje antiguo con Entidad Antigua',
          entities: ['Entidad Antigua'],
          created_at: '2025-09-30T09:00:00Z',
        },
        {
          id: '2',
          role: 'user',
          content: 'Mensaje antiguo 2',
          created_at: '2025-09-30T09:30:00Z',
        },
        ...mockHistory,
      ]

      const entities = extractEntitiesFromHistory(longHistory)
      // Should not include "Entidad Antigua" from old messages
      expect(entities).not.toContain('Entidad Antigua')
    })

    it('should deduplicate entities', () => {
      const entities = extractEntitiesFromHistory(mockHistory)
      const uniqueEntities = Array.from(new Set(entities))
      expect(entities.length).toBe(uniqueEntities.length)
    })

    it('should return empty array for empty history', () => {
      const entities = extractEntitiesFromHistory([])
      expect(entities).toEqual([])
    })
  })

  describe('buildContextSummary', () => {
    const mockHistory: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'Quiero información sobre buceo en Blue Life Dive',
        created_at: '2025-09-30T10:00:00Z',
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Blue Life Dive es una escuela de buceo certificada PADI ubicada en San Andrés',
        created_at: '2025-09-30T10:00:05Z',
      },
    ]

    it('should build summary with recent messages', () => {
      const summary = buildContextSummary(mockHistory, ['Blue Life Dive', 'buceo'])

      expect(summary).toContain('Usuario [1]')
      expect(summary).toContain('Asistente [2]')
      expect(summary).toContain('buceo')
    })

    it('should include entities summary', () => {
      const summary = buildContextSummary(mockHistory, ['Blue Life Dive', 'buceo'])

      expect(summary).toContain('Entidades mencionadas')
      expect(summary).toContain('Blue Life Dive')
      expect(summary).toContain('buceo')
    })

    it('should truncate long messages', () => {
      const longMessage = 'A'.repeat(200) // 200 chars
      const history: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: longMessage,
          created_at: '2025-09-30T10:00:00Z',
        },
      ]

      const summary = buildContextSummary(history, [])
      // Should be truncated to ~150 chars + "..."
      expect(summary.length).toBeLessThan(200)
      expect(summary).toContain('...')
    })

    it('should limit to last 3 messages', () => {
      const longHistory: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Mensaje muy antiguo',
          created_at: '2025-09-30T09:00:00Z',
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Respuesta antigua',
          created_at: '2025-09-30T09:00:05Z',
        },
        ...mockHistory,
      ]

      const summary = buildContextSummary(longHistory, [])
      // Should NOT contain "Mensaje muy antiguo"
      expect(summary).not.toContain('Mensaje muy antiguo')
      // Should contain recent messages
      expect(summary).toContain('buceo')
    })

    it('should handle empty entities', () => {
      const summary = buildContextSummary(mockHistory, [])
      // Should not crash, should not include entities section
      expect(summary).not.toContain('Entidades mencionadas')
    })
  })
})
