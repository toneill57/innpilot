'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { EntityBadge } from './EntityBadge'
import type { TrackedEntity } from '@/lib/guest-chat-types'

interface EntityTimelineProps {
  entities: Map<string, TrackedEntity>
  onEntityClick: (entity: string) => void
  onClearContext: () => void
  onJumpToMessage?: (entity: string) => void
}

/**
 * EntityTimeline Component - FASE 2.2
 *
 * Features:
 * - Animated timeline showing when entities were mentioned
 * - Staggered entrance animations with Framer Motion
 * - Quick jump to related messages
 * - Clear context button with confirmation
 * - Collapsible timeline view
 * - Color-coded by entity type
 */
export function EntityTimeline({
  entities,
  onEntityClick,
  onClearContext,
  onJumpToMessage,
}: EntityTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const sortedEntities = Array.from(entities.values()).sort(
    (a, b) => b.firstMentioned.getTime() - a.firstMentioned.getTime()
  )

  if (entities.size === 0) {
    return null
  }

  const handleClearContext = () => {
    if (!showClearConfirm) {
      setShowClearConfirm(true)
      setTimeout(() => setShowClearConfirm(false), 3000)
      return
    }

    onClearContext()
    setShowClearConfirm(false)
  }

  const formatTime = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `Hace ${diffMins}m`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Hace ${diffHours}h`

    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <Clock className="h-4 w-4 text-blue-600" />
            <span>Contexto de conversación ({entities.size})</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClearContext}
            className={`
              flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg
              transition-all duration-200
              ${
                showClearConfirm
                  ? 'bg-red-100 text-red-700 border border-red-300 animate-shake'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
              }
            `}
          >
            {showClearConfirm ? (
              <>
                <AlertCircle className="h-3.5 w-3.5" />
                <span>¿Confirmar?</span>
              </>
            ) : (
              <>
                <X className="h-3.5 w-3.5" />
                <span>Limpiar</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Timeline */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="relative pl-6 space-y-3">
                {/* Timeline vertical line */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: '100%' }}
                  transition={{ duration: 0.5 }}
                  className="absolute left-2 top-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-gray-300"
                />

                {sortedEntities.map((entity, index) => (
                  <motion.div
                    key={entity.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    {/* Timeline dot */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                      className={`
                        absolute -left-6 top-2 h-4 w-4 rounded-full border-2 border-white
                        ${
                          entity.type === 'activity'
                            ? 'bg-green-500'
                            : entity.type === 'place'
                            ? 'bg-blue-500'
                            : entity.type === 'amenity'
                            ? 'bg-purple-500'
                            : 'bg-gray-500'
                        }
                      `}
                    >
                      {entity.mentionCount > 1 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 h-3 w-3 flex items-center justify-center text-[8px] font-bold text-white bg-red-500 rounded-full"
                        >
                          {entity.mentionCount}
                        </motion.span>
                      )}
                    </motion.div>

                    {/* Entity card */}
                    <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <EntityBadge
                          entity={entity.name}
                          type={entity.type}
                          onClick={() => onEntityClick(entity.name)}
                        />

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(entity.firstMentioned)}</span>
                          {entity.mentionCount > 1 && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                              {entity.mentionCount}x
                            </span>
                          )}
                        </div>
                      </div>

                      {onJumpToMessage && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onJumpToMessage(entity.name)}
                          className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          aria-label={`Jump to ${entity.name}`}
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed view - show badges only */}
        <AnimatePresence>
          {!isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap gap-2"
            >
              {sortedEntities.slice(0, 5).map((entity, index) => (
                <motion.div
                  key={entity.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <EntityBadge
                    entity={entity.name}
                    type={entity.type}
                    onClick={() => onEntityClick(entity.name)}
                  />
                </motion.div>
              ))}
              {entities.size > 5 && (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  +{entities.size - 5} más
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
