'use client'

import React, { useState } from 'react'
import DevChatBubble from './DevChatBubble'
import DevChatInterface from './DevChatInterface'

/**
 * DevChat - Development version of public chat for testing improvements
 *
 * This is an EXACT copy of PublicChat but isolated for development.
 * All changes should be made here, NOT in the original PublicChat.
 *
 * Features:
 * - No authentication required
 * - Marketing-focused design (tropical vibes)
 * - Floating chat bubble that expands to full interface
 * - Photo previews and availability CTAs
 * - Mobile-optimized responsive layout
 *
 * Usage:
 * Add to your dev/test pages:
 *
 * import DevChat from '@/components/Dev/DevChat'
 *
 * export default function DevPage() {
 *   return (
 *     <>
 *       <YourContent />
 *       <DevChat />
 *     </>
 *   )
 * }
 */
export default function DevChat() {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleChat = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <>
      <DevChatBubble onClick={toggleChat} isExpanded={isExpanded} />
      <DevChatInterface onMinimize={toggleChat} isExpanded={isExpanded} />
    </>
  )
}
