'use client'

import React from 'react'
import { Sparkles, AlertCircle } from 'lucide-react'
import { trackAvailabilityCTAClick } from '@/lib/analytics'

interface DevAvailabilityCTAProps {
  availabilityUrl?: string
  disabled?: boolean
  disabledReason?: string
}

export default function DevAvailabilityCTA({
  availabilityUrl,
  disabled = false,
  disabledReason = 'Complete your travel details first'
}: DevAvailabilityCTAProps) {
  if (!availabilityUrl && !disabled) return null

  const handleClick = () => {
    if (disabled || !availabilityUrl) return

    // Get session ID from localStorage
    const sessionId = localStorage.getItem('dev_chat_session_id')

    // Track click event
    trackAvailabilityCTAClick(availabilityUrl, sessionId)

    // Open in new tab
    window.open(availabilityUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="my-4">
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          w-full py-4 px-6 rounded-xl font-semibold text-lg
          flex items-center justify-center gap-2
          shadow-lg transition-all duration-300
          ${disabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-teal-500 via-cyan-500 to-coral-500 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] animate-pulse-subtle'
          }
        `}
        aria-label={disabled ? disabledReason : 'Check availability and book now'}
        title={disabled ? disabledReason : undefined}
      >
        {disabled ? (
          <>
            <AlertCircle className="w-5 h-5" />
            <span>Complete Travel Details</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 animate-sparkle" />
            <span>Check Availability</span>
            <Sparkles className="w-5 h-5 animate-sparkle animation-delay-300" />
          </>
        )}
      </button>

      {disabled && disabledReason && (
        <p className="text-xs text-gray-500 text-center mt-2">
          {disabledReason}
        </p>
      )}
    </div>
  )
}
