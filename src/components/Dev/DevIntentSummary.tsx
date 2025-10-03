'use client'

import React, { useState } from 'react'
import { Calendar, Users, Home, Edit2 } from 'lucide-react'

interface TravelIntent {
  check_in_date?: string
  check_out_date?: string
  num_guests?: number
  accommodation_type?: string
}

interface DevIntentSummaryProps {
  intent: TravelIntent
  onEdit?: () => void
}

export default function DevIntentSummary({ intent, onEdit }: DevIntentSummaryProps) {
  const [isEditing, setIsEditing] = useState(false)

  // Only show if we have any intent data
  const hasIntent = intent.check_in_date || intent.check_out_date || intent.num_guests || intent.accommodation_type

  if (!hasIntent) return null

  // Format dates nicely
  const formatDateRange = () => {
    if (!intent.check_in_date || !intent.check_out_date) return null

    try {
      const checkIn = new Date(intent.check_in_date)
      const checkOut = new Date(intent.check_out_date)

      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
      const checkInStr = checkIn.toLocaleDateString('en-US', options)
      const checkOutStr = checkOut.toLocaleDateString('en-US', options)

      return `${checkInStr} - ${checkOutStr}`
    } catch (e) {
      return `${intent.check_in_date} - ${intent.check_out_date}`
    }
  }

  const dateRange = formatDateRange()

  return (
    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200
                    rounded-lg p-3 mb-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-teal-900">
          Your Travel Details
        </h4>
        {onEdit && (
          <button
            onClick={() => {
              setIsEditing(!isEditing)
              onEdit()
            }}
            className="text-teal-600 hover:text-teal-800 transition-colors p-1"
            aria-label="Edit travel details"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        {dateRange && (
          <div className="flex items-center gap-1.5 text-teal-700">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">{dateRange}</span>
          </div>
        )}

        {intent.num_guests && (
          <div className="flex items-center gap-1.5 text-teal-700">
            <Users className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">
              {intent.num_guests} {intent.num_guests === 1 ? 'guest' : 'guests'}
            </span>
          </div>
        )}

        {intent.accommodation_type && (
          <div className="flex items-center gap-1.5 text-teal-700">
            <Home className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium capitalize">{intent.accommodation_type}</span>
          </div>
        )}
      </div>
    </div>
  )
}
