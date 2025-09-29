'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  History,
  TrendingUp,
  Database,
  RefreshCw
} from 'lucide-react'

interface SyncHistoryItem {
  id: string
  sync_type: string
  status: string
  records_processed: number
  records_created: number
  records_updated: number
  error_message?: string
  started_at: string
  completed_at?: string
  metadata?: any
}

interface SyncStatusData {
  last_sync: SyncHistoryItem | null
  history: SyncHistoryItem[]
  count: number
}

interface SyncStatusIndicatorProps {
  tenantId: string
  onRefresh?: () => void
}

export function SyncStatusIndicator({ tenantId, onRefresh }: SyncStatusIndicatorProps) {
  const [statusData, setStatusData] = useState<SyncStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    fetchSyncStatus()
  }, [tenantId])

  const fetchSyncStatus = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/integrations/motopress/sync?tenant_id=${tenantId}`)
      const data = await response.json()

      setStatusData(data)
    } catch (error) {
      console.error('Failed to fetch sync status:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Success</Badge>
      case 'partial_success':
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Partial</Badge>
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const formatDuration = (startedAt: string, completedAt?: string) => {
    const start = new Date(startedAt)
    const end = completedAt ? new Date(completedAt) : new Date()
    const durationMs = end.getTime() - start.getTime()

    if (durationMs < 1000) return `${durationMs}ms`
    if (durationMs < 60000) return `${Math.round(durationMs / 1000)}s`
    return `${Math.round(durationMs / 60000)}m`
  }

  const calculateStats = () => {
    if (!statusData?.history) return null

    const totalSyncs = statusData.history.length
    const successfulSyncs = statusData.history.filter(h => h.status === 'success').length
    const totalProcessed = statusData.history.reduce((sum, h) => sum + h.records_processed, 0)
    const totalCreated = statusData.history.reduce((sum, h) => sum + h.records_created, 0)
    const totalUpdated = statusData.history.reduce((sum, h) => sum + h.records_updated, 0)

    return {
      totalSyncs,
      successRate: totalSyncs > 0 ? Math.round((successfulSyncs / totalSyncs) * 100) : 0,
      totalProcessed,
      totalCreated,
      totalUpdated
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading sync status...
        </CardContent>
      </Card>
    )
  }

  if (!statusData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sync Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No sync history available</p>
        </CardContent>
      </Card>
    )
  }

  const stats = calculateStats()
  const lastSync = statusData.last_sync

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="w-4 h-4" />
            Sync Status
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSyncStatus}
            className="h-7 px-2"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Last Sync */}
        {lastSync && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Last Sync</span>
              {getStatusBadge(lastSync.status)}
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>{formatDate(lastSync.started_at)}</p>
              <p>Duration: {formatDuration(lastSync.started_at, lastSync.completed_at)}</p>

              {lastSync.records_processed > 0 && (
                <div className="flex gap-4">
                  <span>Processed: {lastSync.records_processed}</span>
                  <span className="text-green-600">Created: {lastSync.records_created}</span>
                  <span className="text-blue-600">Updated: {lastSync.records_updated}</span>
                </div>
              )}

              {lastSync.error_message && (
                <p className="text-red-500 text-xs mt-1">{lastSync.error_message}</p>
              )}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {stats && stats.totalSyncs > 0 && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span>{stats.successRate}% Success</span>
            </div>
            <div className="flex items-center gap-1">
              <Database className="w-3 h-3 text-blue-500" />
              <span>{stats.totalProcessed} Total</span>
            </div>
          </div>
        )}

        {/* History Toggle */}
        {statusData.history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full h-7 text-xs"
          >
            {showHistory ? 'Hide' : 'Show'} History ({statusData.history.length})
          </Button>
        )}

        {/* Sync History */}
        {showHistory && statusData.history.length > 0 && (
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {statusData.history.map((item) => (
                <div key={item.id} className="border rounded p-2 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{item.sync_type}</span>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="text-muted-foreground space-y-1">
                    <p>{formatDate(item.started_at)}</p>

                    {item.records_processed > 0 && (
                      <div className="flex gap-2">
                        <span>P: {item.records_processed}</span>
                        <span className="text-green-600">C: {item.records_created}</span>
                        <span className="text-blue-600">U: {item.records_updated}</span>
                      </div>
                    )}

                    {item.error_message && (
                      <p className="text-red-500 text-xs">
                        {item.error_message.substring(0, 100)}
                        {item.error_message.length > 100 && '...'}
                      </p>
                    )}

                    {item.metadata?.duration_ms && (
                      <p>Duration: {item.metadata.duration_ms}ms</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* No History */}
        {statusData.history.length === 0 && (
          <div className="text-center py-4">
            <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">No sync history yet</p>
            <p className="text-xs text-muted-foreground">Run your first sync to see status here</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}