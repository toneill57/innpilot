'use client'

import React, { useState } from 'react'
import PublicChatBubble from './PublicChatBubble'
import PublicChatInterface from './PublicChatInterface'

/**
 * PublicChat - Main wrapper component for public-facing marketing chat
 *
 * Features:
 * - No authentication required
 * - Marketing-focused design (tropical vibes)
 * - Floating chat bubble that expands to full interface
 * - Photo previews and availability CTAs
 * - Mobile-optimized responsive layout
 *
 * Usage:
 * Add to your public pages (landing page, etc):
 *
 * import PublicChat from '@/components/Public/PublicChat'
 *
 * export default function LandingPage() {
 *   return (
 *     <>
 *       <YourContent />
 *       <PublicChat />
 *     </>
 *   )
 * }
 */
export default function PublicChat() {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleChat = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <>
      <PublicChatBubble onClick={toggleChat} isExpanded={isExpanded} />
      <PublicChatInterface onMinimize={toggleChat} isExpanded={isExpanded} />
    </>
  )
}
