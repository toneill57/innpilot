'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Wifi, Loader2, Check } from 'lucide-react'

interface OfflineBannerProps {
  onOnline?: () => void
  onOffline?: () => void
}

/**
 * OfflineBanner Component - FASE 2.3
 *
 * Offline mode indicator with sync status
 * Features:
 * - Real-time online/offline detection
 * - Queue pending messages indicator
 * - Sync animation when back online
 * - Smooth slide-in/out animations
 * - Premium status feedback
 */
export function OfflineBanner({ onOnline, onOffline }: OfflineBannerProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [justCameOnline, setJustCameOnline] = useState(false)
  const [pendingMessages, setPendingMessages] = useState(0)

  useEffect(() => {
    // Check initial status
    setIsOnline(navigator.onLine)

    const handleOnline = async () => {
      console.log('Connection restored')
      setIsOnline(true)
      setJustCameOnline(true)

      // Simulate sync process
      const queuedCount = getPendingMessagesCount()
      if (queuedCount > 0) {
        setIsSyncing(true)
        setPendingMessages(queuedCount)

        // Simulate sync delay
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Clear queue
        clearPendingMessages()
        setIsSyncing(false)
        setPendingMessages(0)
      }

      if (onOnline) {
        onOnline()
      }

      // Hide success message after 3 seconds
      setTimeout(() => {
        setJustCameOnline(false)
      }, 3000)
    }

    const handleOffline = () => {
      console.log('Connection lost')
      setIsOnline(false)
      setJustCameOnline(false)

      if (onOffline) {
        onOffline()
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [onOnline, onOffline])

  // Mock functions for pending messages (to be implemented with real queue)
  const getPendingMessagesCount = (): number => {
    const queue = localStorage.getItem('offline_message_queue')
    return queue ? JSON.parse(queue).length : 0
  }

  const clearPendingMessages = () => {
    localStorage.removeItem('offline_message_queue')
  }

  return (
    <AnimatePresence mode="wait">
      {/* Offline Banner */}
      {!isOnline && (
        <motion.div
          key="offline"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
        >
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <WifiOff className="h-5 w-5" />
              </motion.div>

              <div>
                <p className="text-sm font-semibold">Sin conexión a internet</p>
                <p className="text-xs opacity-90">
                  Tus mensajes se enviarán cuando vuelvas a conectarte
                </p>
              </div>
            </div>

            {pendingMessages > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold"
              >
                {pendingMessages} en cola
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Syncing Banner */}
      {isSyncing && (
        <motion.div
          key="syncing"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
        >
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-center gap-3">
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <Loader2 className="h-5 w-5" />
            </motion.div>

            <div>
              <p className="text-sm font-semibold">
                Sincronizando {pendingMessages} {pendingMessages === 1 ? 'mensaje' : 'mensajes'}...
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Back Online Success Banner */}
      {justCameOnline && !isSyncing && (
        <motion.div
          key="online"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
        >
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5 }}
            >
              <Check className="h-5 w-5" />
            </motion.div>

            <div>
              <p className="text-sm font-semibold flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Conexión restaurada
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
