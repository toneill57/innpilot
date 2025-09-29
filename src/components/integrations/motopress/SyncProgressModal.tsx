'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  Database,
  TrendingUp,
  X,
  RefreshCw
} from "lucide-react"

// Updated interface to match actual API response
interface SyncProgressData {
  status: 'no_sync' | 'success' | 'partial_success' | 'error' | 'in_progress'
  message: string
  progress: {
    current: number
    total: number
    percentage: number
  }
  last_sync_at: string | null
  sync_details: {
    sync_type: string
    records_created: number
    records_updated: number
    records_processed: number
    error_message: string | null
    duration_ms?: number
  }
}

// Legacy interface for backward compatibility if needed
interface LegacySyncProgressData {
  status: 'pending' | 'running' | 'success' | 'partial_success' | 'error'
  progress: number
  current_step: string
  total_steps: number
  completed_steps: number
  records_processed: number
  records_created: number
  records_updated: number
  errors?: string[] // Made optional with default
  eta_seconds?: number
  started_at: string
  last_updated: string
}

interface SyncProgressModalProps {
  isOpen: boolean
  onClose: () => void
  tenantId: string
  syncId?: string
  onComplete?: (result: any) => void
}

export function SyncProgressModal({ isOpen, onClose, tenantId, syncId, onComplete }: SyncProgressModalProps) {
  const [progressData, setProgressData] = useState<SyncProgressData | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [pollingDelay, setPollingDelay] = useState(2000) // Start with 2 seconds
  const [isBackingOff, setIsBackingOff] = useState(false)
  const [hasFailedPermanently, setHasFailedPermanently] = useState(false)

  // Use refs to track state across renders and prevent multiple instances
  const isPollingRef = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const componentId = useRef(Math.random().toString(36).substr(2, 9))

  useEffect(() => {
    console.log(`[${componentId.current}] SyncProgressModal: useEffect called`, { isOpen, tenantId, syncId })

    if (isOpen && tenantId && !hasFailedPermanently) {
      // Only start polling after a brief check to see if there's an active sync
      checkForActiveSyncThenStart()
    } else {
      stopPolling()
    }

    return () => {
      console.log(`[${componentId.current}] SyncProgressModal: useEffect cleanup`)
      stopPolling()
    }
  }, [isOpen, tenantId, syncId])

  const checkForActiveSyncThenStart = async () => {
    console.log(`[${componentId.current}] SyncProgressModal: Checking for active sync before starting polling`)

    try {
      const url = syncId
        ? `/api/integrations/motopress/sync/${syncId}/progress?tenant_id=${tenantId}`
        : `/api/integrations/motopress/sync/progress?tenant_id=${tenantId}`

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`[${componentId.current}] SyncProgressModal: Initial check result:`, data)

        // Only start polling if there's an active sync or recent sync worth monitoring
        if (data.status === 'in_progress') {
          console.log(`[${componentId.current}] SyncProgressModal: Active sync found, starting polling`)
          setProgressData(data)
          startPolling()
        } else if (data.status === 'no_sync') {
          console.log(`[${componentId.current}] SyncProgressModal: No active sync found, closing modal`)
          setProgressData(data)
          setTimeout(() => onClose(), 1500) // Close after showing message briefly
        } else {
          // Show final status (success, error, partial_success) and auto-close
          console.log(`[${componentId.current}] SyncProgressModal: Sync completed with status:`, data.status)
          setProgressData(data)
          if (onComplete) onComplete(data)
          setTimeout(() => onClose(), 3000) // Show final status for 3 seconds
        }
      } else {
        console.log(`[${componentId.current}] SyncProgressModal: API check failed, closing modal`)
        setTimeout(() => onClose(), 1500)
      }
    } catch (error) {
      console.error(`[${componentId.current}] SyncProgressModal: Error checking sync status:`, error)
      setTimeout(() => onClose(), 1500)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log(`[${componentId.current}] SyncProgressModal: Component unmounting, cleaning up`)
      forceStopPolling()
    }
  }, [])

  const forceStopPolling = () => {
    console.log(`[${componentId.current}] SyncProgressModal: Force stopping all polling`)

    // Clear all possible intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }

    // Reset all refs and state
    isPollingRef.current = false
    setIsPolling(false)
    setPollingInterval(null)
    setRetryCount(0)
    setPollingDelay(2000)
    setIsBackingOff(false)
  }

  const startPolling = () => {
    console.log(`[${componentId.current}] SyncProgressModal: Starting polling`)

    // Force stop any existing polling first
    forceStopPolling()

    // Only start if not already failed permanently
    if (hasFailedPermanently) {
      console.log(`[${componentId.current}] SyncProgressModal: Skipping start - permanently failed`)
      return
    }

    setIsPolling(true)
    isPollingRef.current = true
    setRetryCount(0)
    setPollingDelay(2000)
    setHasFailedPermanently(false)
    setIsBackingOff(false)

    // Initial fetch
    fetchProgress()

    // Set up interval
    const interval = setInterval(() => {
      if (isPollingRef.current) {
        fetchProgress()
      }
    }, 2000)

    setPollingInterval(interval)
    intervalRef.current = interval
  }

  const stopPolling = () => {
    console.log(`[${componentId.current}] SyncProgressModal: Stopping polling`)
    forceStopPolling()
  }

  const scheduleNextPoll = (delay: number) => {
    console.log(`[${componentId.current}] SyncProgressModal: Scheduling next poll in ${delay}ms`)

    // Clear any existing intervals
    forceStopPolling()

    setIsBackingOff(true)

    const timeout = setTimeout(() => {
      console.log(`[${componentId.current}] SyncProgressModal: Backoff timeout expired, checking if should resume`)

      if (isPollingRef.current && isOpen && tenantId && !hasFailedPermanently) {
        console.log(`[${componentId.current}] SyncProgressModal: Resuming polling after backoff`)
        setIsBackingOff(false)

        // Resume normal polling
        fetchProgress()
        const interval = setInterval(() => {
          if (isPollingRef.current) {
            fetchProgress()
          }
        }, 2000)

        setPollingInterval(interval)
        intervalRef.current = interval
      } else {
        console.log(`[${componentId.current}] SyncProgressModal: Not resuming polling - conditions not met`)
        setIsBackingOff(false)
        isPollingRef.current = false
      }
    }, delay)

    setPollingInterval(timeout as any)
    intervalRef.current = timeout as any
  }

  const fetchProgress = async () => {
    console.log(`[${componentId.current}] SyncProgressModal: fetchProgress called`, {
      isPolling: isPollingRef.current,
      tenantId,
      hasFailedPermanently
    })

    // Safety check - don't fetch if not polling, no tenant, or permanently failed
    if (!isPollingRef.current || !tenantId || hasFailedPermanently) {
      console.log(`[${componentId.current}] SyncProgressModal: Skipping fetch - conditions not met`)
      return
    }

    try {
      const url = syncId
        ? `/api/integrations/motopress/sync/${syncId}/progress?tenant_id=${tenantId}`
        : `/api/integrations/motopress/sync/progress?tenant_id=${tenantId}`

      console.log('SyncProgressModal: Fetching progress from:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('SyncProgressModal: Response status:', response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        console.log('SyncProgressModal: Progress data received:', data)
        setProgressData(data)

        // Reset retry count on successful request
        setRetryCount(0)
        setPollingDelay(2000)
        setIsBackingOff(false)

        // Stop polling if sync is complete or no sync exists
        if (data.status === 'success' || data.status === 'error' || data.status === 'partial_success' || data.status === 'no_sync') {
          console.log(`[${componentId.current}] SyncProgressModal: Stopping polling due to status:`, data.status)
          isPollingRef.current = false // Immediately stop ref-based polling
          stopPolling()

          // Auto-close modal after a short delay for 'no_sync' status
          if (data.status === 'no_sync') {
            setTimeout(() => {
              console.log(`[${componentId.current}] SyncProgressModal: Auto-closing modal - no sync found`)
              onClose()
            }, 2000) // Show "No active sync found" for 2 seconds then close
          }

          if (onComplete) {
            onComplete(data)
          }
        } else {
          console.log(`[${componentId.current}] SyncProgressModal: Continuing polling for status:`, data.status)
        }
      } else if (response.status === 404) {
        console.log(`[${componentId.current}] SyncProgressModal: No active sync found (404)`)
        setProgressData(null)
        isPollingRef.current = false
        stopPolling()

        // Auto-close modal after showing 404 message
        setTimeout(() => {
          console.log(`[${componentId.current}] SyncProgressModal: Auto-closing modal - 404 not found`)
          onClose()
        }, 2000)
      } else if (response.status === 429) {
        // Handle rate limiting with exponential backoff
        const errorText = await response.text()
        let retryAfter = 60 // Default from error message

        try {
          const errorData = JSON.parse(errorText)
          retryAfter = errorData.retryAfter || 60
        } catch {
          // Use default if parsing fails
        }

        const newRetryCount = retryCount + 1
        const backoffDelay = Math.min(retryAfter * 1000, Math.pow(2, newRetryCount) * 1000) // Exponential backoff with max of retryAfter

        console.warn(`SyncProgressModal: Rate limited (429). Retry ${newRetryCount}, backing off for ${backoffDelay}ms`)

        setRetryCount(newRetryCount)
        setPollingDelay(backoffDelay)

        // Schedule next poll with backoff delay
        scheduleNextPoll(backoffDelay)
        return
      } else {
        const errorText = await response.text()
        console.error('SyncProgressModal: HTTP error:', response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error('SyncProgressModal: Error fetching sync progress:', error)
      console.error('SyncProgressModal: Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })

      // Handle network errors with retry logic
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        const newRetryCount = retryCount + 1
        const maxRetries = 3 // Reduced max retries to fail faster

        if (newRetryCount <= maxRetries) {
          const backoffDelay = Math.pow(2, newRetryCount) * 1000 // Exponential backoff
          console.log(`SyncProgressModal: Network error, retry ${newRetryCount}/${maxRetries} in ${backoffDelay}ms`)

          setRetryCount(newRetryCount)
          setPollingDelay(backoffDelay)

          // Schedule next poll with backoff delay
          scheduleNextPoll(backoffDelay)
          return
        } else {
          console.error(`[${componentId.current}] SyncProgressModal: Max retries (${maxRetries}) exceeded. Stopping polling permanently.`)
          setHasFailedPermanently(true)
          isPollingRef.current = false
        }
      }

      // Set error state and stop polling after max retries
      setProgressData({
        status: 'error',
        message: hasFailedPermanently ? 'Connection failed permanently' : 'Failed to fetch sync progress',
        progress: { current: 0, total: 0, percentage: 0 },
        last_sync_at: null,
        sync_details: {
          sync_type: 'unknown',
          records_created: 0,
          records_updated: 0,
          records_processed: 0,
          error_message: error instanceof Error ? error.message : String(error)
        }
      })
      stopPolling()
    }
  }


  const getStatusIcon = () => {
    if (!progressData) return <Loader2 className="h-5 w-5 animate-spin" />

    switch (progressData.status) {
      case 'no_sync':
        return <Clock className="h-5 w-5 text-gray-500" />
      case 'in_progress':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'partial_success':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Loader2 className="h-5 w-5 animate-spin" />
    }
  }

  const getStatusBadge = () => {
    if (!progressData) return null

    switch (progressData.status) {
      case 'no_sync':
        return <Badge variant="outline">No Sync</Badge>
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500">In Progress</Badge>
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>
      case 'partial_success':
        return <Badge variant="secondary" className="bg-yellow-500">Partial Success</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <DialogTitle>Sync Progress</DialogTitle>
            </div>
            {getStatusBadge()}
          </div>
          <DialogDescription>
            MotoPress integration sync status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {progressData ? (
            <>
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{progressData.message}</span>
                  <span className="text-muted-foreground">
                    {progressData.progress.current}/{progressData.progress.total}
                  </span>
                </div>
                <Progress
                  value={progressData.progress.percentage}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{progressData.progress.percentage}% complete</span>
                  {progressData.sync_details.duration_ms && progressData.status === 'in_progress' && (
                    <span>Duration: {Math.round(progressData.sync_details.duration_ms / 1000)}s</span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 py-3 border-t border-b">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {progressData.sync_details.records_processed}
                  </div>
                  <div className="text-xs text-muted-foreground">Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {progressData.sync_details.records_created}
                  </div>
                  <div className="text-xs text-muted-foreground">Created</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">
                    {progressData.sync_details.records_updated}
                  </div>
                  <div className="text-xs text-muted-foreground">Updated</div>
                </div>
              </div>

              {/* Status Info */}
              <div className="space-y-2 text-sm">
                {progressData.last_sync_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Sync:</span>
                    <span>{new Date(progressData.last_sync_at).toLocaleTimeString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sync Type:</span>
                  <span className="capitalize">{progressData.sync_details.sync_type}</span>
                </div>
                {progressData.sync_details.duration_ms && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{Math.round(progressData.sync_details.duration_ms / 1000)}s</span>
                  </div>
                )}
              </div>

              {/* Errors */}
              {progressData.sync_details.error_message && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700">
                      Error Details
                    </span>
                  </div>
                  <div className="max-h-20 overflow-y-auto">
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {progressData.sync_details.error_message}
                    </div>
                  </div>
                </div>
              )}

            </>
          ) : (
            <div className="text-center py-8">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {isBackingOff
                  ? `Rate limited, retrying in ${Math.round(pollingDelay / 1000)}s...`
                  : isPolling
                    ? 'Waiting for sync to start...'
                    : 'No active sync found'
                }
              </p>
              {retryCount > 0 && (
                <p className="text-xs text-yellow-600 mt-2">
                  Retry attempt: {retryCount}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProgress}
            disabled={!progressData || progressData.status === 'in_progress'}
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Refresh
          </Button>

          <Button
            variant={progressData?.status === 'in_progress' ? 'secondary' : 'default'}
            size="sm"
            onClick={onClose}
          >
            {progressData?.status === 'in_progress' ? 'Run in Background' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}