'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Database,
  Calendar,
  BarChart3,
  History,
  RefreshCw,
  Eye,
  AlertTriangle
} from 'lucide-react'

interface SyncRecord {
  id: string
  integration_type: string
  sync_type: string
  status: string
  records_processed: number
  records_created: number
  records_updated: number
  error_message?: string
  metadata?: any
  started_at: string
  completed_at?: string
}

interface SyncStats {
  total_syncs: number
  successful_syncs: number
  failed_syncs: number
  total_records_processed: number
  total_records_created: number
  total_records_updated: number
  success_rate: number
  avg_duration: number
  last_24h_syncs: number
  last_7d_syncs: number
}

interface SyncHistoryVisualizationProps {
  tenantId: string
  integrationType?: string
}

export function SyncHistoryVisualization({ tenantId, integrationType = 'motopress' }: SyncHistoryVisualizationProps) {
  const [syncHistory, setSyncHistory] = useState<SyncRecord[]>([])
  const [stats, setStats] = useState<SyncStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSync, setSelectedSync] = useState<SyncRecord | null>(null)

  useEffect(() => {
    fetchSyncData()
  }, [tenantId, integrationType])

  const fetchSyncData = async () => {
    setIsLoading(true)
    try {
      // Fetch sync history
      const historyResponse = await fetch(`/api/integrations/${integrationType}/sync?tenant_id=${tenantId}`)
      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setSyncHistory(historyData.history || [])

        // Calculate stats
        const calculatedStats = calculateStats(historyData.history || [])
        setStats(calculatedStats)
      }
    } catch (error) {
      console.error('Error fetching sync history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (history: SyncRecord[]): SyncStats => {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const totalSyncs = history.length
    const successfulSyncs = history.filter(h => h.status === 'success').length
    const failedSyncs = history.filter(h => h.status === 'error').length

    const totalRecordsProcessed = history.reduce((sum, h) => sum + (h.records_processed || 0), 0)
    const totalRecordsCreated = history.reduce((sum, h) => sum + (h.records_created || 0), 0)
    const totalRecordsUpdated = history.reduce((sum, h) => sum + (h.records_updated || 0), 0)

    const last24hSyncs = history.filter(h => new Date(h.started_at) > last24h).length
    const last7dSyncs = history.filter(h => new Date(h.started_at) > last7d).length

    // Calculate average duration
    const completedSyncs = history.filter(h => h.completed_at)
    const totalDuration = completedSyncs.reduce((sum, h) => {
      const start = new Date(h.started_at)
      const end = new Date(h.completed_at!)
      return sum + (end.getTime() - start.getTime())
    }, 0)
    const avgDuration = completedSyncs.length > 0 ? totalDuration / completedSyncs.length : 0

    return {
      total_syncs: totalSyncs,
      successful_syncs: successfulSyncs,
      failed_syncs: failedSyncs,
      total_records_processed: totalRecordsProcessed,
      total_records_created: totalRecordsCreated,
      total_records_updated: totalRecordsUpdated,
      success_rate: totalSyncs > 0 ? Math.round((successfulSyncs / totalSyncs) * 100) : 0,
      avg_duration: avgDuration,
      last_24h_syncs: last24hSyncs,
      last_7d_syncs: last7dSyncs
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Success</Badge>
      case 'partial_success':
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Partial</Badge>
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
    if (!completedAt) return 'N/A'

    const start = new Date(startedAt)
    const end = new Date(completedAt)
    const durationMs = end.getTime() - start.getTime()

    if (durationMs < 1000) return `${durationMs}ms`
    if (durationMs < 60000) return `${Math.round(durationMs / 1000)}s`
    return `${Math.round(durationMs / 60000)}m ${Math.round((durationMs % 60000) / 1000)}s`
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <p>Loading sync history...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Sync History & Analytics
            </CardTitle>
            <CardDescription>
              Integration sync statistics and detailed history
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSyncData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {stats && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Syncs</p>
                          <p className="text-2xl font-bold">{stats.total_syncs}</p>
                        </div>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                          <p className="text-2xl font-bold text-green-600">{stats.success_rate}%</p>
                        </div>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Records Processed</p>
                          <p className="text-2xl font-bold text-blue-600">{stats.total_records_processed}</p>
                        </div>
                        <Database className="h-4 w-4 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                          <p className="text-2xl font-bold">{Math.round(stats.avg_duration / 1000)}s</p>
                        </div>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Activity Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last 24 hours:</span>
                        <span className="font-medium">{stats.last_24h_syncs} syncs</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last 7 days:</span>
                        <span className="font-medium">{stats.last_7d_syncs} syncs</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Data Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Records Created:</span>
                        <span className="font-medium text-green-600">{stats.total_records_created}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Records Updated:</span>
                        <span className="font-medium text-blue-600">{stats.total_records_updated}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {syncHistory.map((sync) => (
                  <Card
                    key={sync.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedSync(sync)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{sync.sync_type}</span>
                          {getStatusBadge(sync.status)}
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                        <div>
                          <p>Started: {formatDate(sync.started_at)}</p>
                          <p>Duration: {formatDuration(sync.started_at, sync.completed_at)}</p>
                        </div>
                        <div>
                          <p>Processed: {sync.records_processed}</p>
                          <p>Created: <span className="text-green-600">{sync.records_created}</span> | Updated: <span className="text-blue-600">{sync.records_updated}</span></p>
                        </div>
                      </div>

                      {sync.error_message && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">
                          {sync.error_message.substring(0, 100)}
                          {sync.error_message.length > 100 && '...'}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {syncHistory.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">No sync history available</p>
                    <p className="text-xs text-muted-foreground">Sync data will appear here after your first integration sync</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {selectedSync ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Sync Details</CardTitle>
                    {getStatusBadge(selectedSync.status)}
                  </div>
                  <CardDescription>
                    {selectedSync.sync_type} • {formatDate(selectedSync.started_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Execution Info</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Started:</span>
                          <span>{formatDate(selectedSync.started_at)}</span>
                        </div>
                        {selectedSync.completed_at && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Completed:</span>
                            <span>{formatDate(selectedSync.completed_at)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span>{formatDuration(selectedSync.started_at, selectedSync.completed_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Data Summary</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Processed:</span>
                          <span>{selectedSync.records_processed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created:</span>
                          <span className="text-green-600">{selectedSync.records_created}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Updated:</span>
                          <span className="text-blue-600">{selectedSync.records_updated}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedSync.error_message && (
                    <div>
                      <h4 className="font-medium mb-2 text-red-600">Error Details</h4>
                      <div className="p-3 bg-red-50 rounded-md">
                        <p className="text-sm text-red-700">{selectedSync.error_message}</p>
                      </div>
                    </div>
                  )}

                  {selectedSync.metadata && (
                    <div>
                      <h4 className="font-medium mb-2">Additional Metadata</h4>
                      <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">
                        {JSON.stringify(selectedSync.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8">
                <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Select a sync from the history to view details</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}