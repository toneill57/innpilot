'use client'

import React from 'react'
import { MessageCircle } from 'lucide-react'
import { trackChatOpened } from '@/lib/analytics'

interface PublicChatBubbleProps {
  onClick: () => void
  isExpanded: boolean
}

export default function PublicChatBubble({ onClick, isExpanded }: PublicChatBubbleProps) {
  if (isExpanded) return null

  const handleClick = () => {
    trackChatOpened()
    onClick()
  }

  return (
    <button
      onClick={handleClick}
      className="fixed z-[9999] flex items-center justify-center gap-2
                 bg-gradient-to-br from-teal-500 to-cyan-600
                 text-white rounded-full shadow-lg
                 hover:shadow-xl hover:scale-105
                 active:scale-95
                 transition-all duration-300 ease-out
                 bottom-5 right-5
                 md:bottom-8 md:right-8
                 sm:bottom-[80px] sm:left-1/2 sm:-translate-x-1/2 sm:right-auto
                 w-14 h-14 md:w-16 md:h-16
                 group"
      aria-label="Open chat"
      aria-expanded={isExpanded}
    >
      <MessageCircle
        className="w-6 h-6 md:w-7 md:h-7 group-hover:rotate-12 transition-transform duration-300"
        strokeWidth={2}
      />

      {/* Pulse animation ring */}
      <span className="absolute inset-0 rounded-full bg-teal-400 opacity-0
                       group-hover:opacity-30 group-hover:scale-125
                       transition-all duration-500" />

      {/* Small badge */}
      <span className="absolute -top-1 -right-1 bg-coral-500 text-white text-xs
                       font-bold px-2 py-0.5 rounded-full shadow-md
                       animate-bounce-subtle">
        Chat
      </span>
    </button>
  )
}
