'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  threshold?: number
  disabled?: boolean
}

/**
 * PullToRefresh Component - FASE 2.3
 *
 * Mobile pull-to-refresh gesture
 * Features:
 * - Smooth spring physics animation
 * - Custom refresh indicator
 * - Touch gesture handling
 * - Loading state during refresh
 * - Haptic feedback (if supported)
 */
export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [startY, setStartY] = useState(0)
  const pullDistance = useSpring(0, {
    stiffness: 300,
    damping: 30,
  })

  const containerRef = useRef<HTMLDivElement>(null)

  // Transform pull distance to rotation for indicator
  const rotation = useTransform(pullDistance, [0, threshold], [0, 360])
  const opacity = useTransform(pullDistance, [0, threshold], [0, 1])
  const scale = useTransform(pullDistance, [0, threshold], [0.5, 1])

  useEffect(() => {
    const container = containerRef.current
    if (!container || disabled) return

    let pulling = false

    const handleTouchStart = (e: TouchEvent) => {
      // Only enable pull-to-refresh at top of scroll
      if (container.scrollTop === 0) {
        setStartY(e.touches[0].clientY)
        pulling = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!pulling || container.scrollTop > 0) return

      const currentY = e.touches[0].clientY
      const distance = Math.max(0, currentY - startY)

      // Apply resistance effect
      const resistedDistance = Math.min(distance * 0.5, threshold * 1.5)
      pullDistance.set(resistedDistance)

      // Prevent default scroll if pulling enough
      if (distance > 10) {
        e.preventDefault()
      }
    }

    const handleTouchEnd = async () => {
      if (!pulling) return
      pulling = false

      const currentDistance = pullDistance.get()

      if (currentDistance >= threshold && !isRefreshing) {
        // Trigger haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50)
        }

        setIsRefreshing(true)
        pullDistance.set(threshold)

        try {
          await onRefresh()
        } catch (err) {
          console.error('Refresh error:', err)
        } finally {
          setIsRefreshing(false)
          pullDistance.set(0)
        }
      } else {
        // Snap back
        pullDistance.set(0)
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pullDistance, threshold, onRefresh, isRefreshing, disabled])

  return (
    <div ref={containerRef} className="relative h-full overflow-auto">
      {/* Refresh Indicator */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center"
        style={{
          y: pullDistance,
          opacity,
        }}
      >
        <motion.div
          className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center"
          style={{
            scale,
          }}
        >
          <motion.div
            style={{
              rotate: isRefreshing ? undefined : rotation,
            }}
            animate={
              isRefreshing
                ? {
                    rotate: [0, 360],
                  }
                : {}
            }
            transition={
              isRefreshing
                ? {
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear',
                  }
                : {}
            }
          >
            <RefreshCw
              className={`h-6 w-6 ${
                isRefreshing ? 'text-blue-600' : 'text-gray-600'
              }`}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        style={{
          y: pullDistance,
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}
