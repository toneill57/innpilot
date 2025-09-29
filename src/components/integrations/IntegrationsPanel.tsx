'use client'

import { useState, useEffect } from 'react'
import { useIntegrationFetch } from '@/hooks/useRetryFetch'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Settings,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus,
  Database
} from "lucide-react"
import { MotoPresConfigModal } from './MotoPresConfigModal'
import { SyncProgressModal } from './motopress/SyncProgressModal'

interface IntegrationStatus {
  id: string
  name: string
  type: 'motopress' | 'booking' | 'airbnb'
  isActive: boolean
  isConnected: boolean
  lastSync?: Date
  syncStatus: 'idle' | 'syncing' | 'success' | 'error'
  accommodationsCount?: number
  errorMessage?: string
}

interface IntegrationsPanelProps {
  tenantId: string
  onMotoPressConfigure?: () => void
  onImport?: (type: string) => void
}

export function IntegrationsPanel({ tenantId, onMotoPressConfigure, onImport }: IntegrationsPanelProps) {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showMotoPresConfig, setShowMotoPresConfig] = useState(false)
  const [showSyncProgress, setShowSyncProgress] = useState(false)
  const [isSyncStarting, setIsSyncStarting] = useState(false)
  const { fetchWithRetry, error: retryError, attemptCount } = useIntegrationFetch()

  // Fetch real integration data
  useEffect(() => {
    fetchIntegrations()
  }, [tenantId])

  // Prevent unnecessary fetches while sync modal is open
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    // Only refresh status periodically when not actively syncing
    if (!showSyncProgress && !isSyncStarting) {
      intervalId = setInterval(() => {
        // Only refresh if no sync is in progress
        const hasActiveSyncing = integrations.some(i => i.syncStatus === 'syncing')
        if (!hasActiveSyncing) {
          fetchIntegrations()
        }
      }, 30000) // Refresh every 30 seconds when idle
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [showSyncProgress, isSyncStarting, integrations])

  const fetchIntegrations = async () => {
    setIsLoading(true)
    try {
      let motoPresStatus: IntegrationStatus = {
        id: 'motopress',
        name: 'MotoPress Hotel Booking',
        type: 'motopress',
        isActive: false,
        isConnected: false,
        syncStatus: 'idle',
        accommodationsCount: 0
      }

      try {
        // Check MotoPress configuration with retry logic
        const data = await fetchWithRetry(`/api/integrations/motopress/test-connection`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tenant_id: tenantId }),
        })

        motoPresStatus.isConnected = data.connected
        motoPresStatus.isActive = data.connected

        // If connected, get sync status and accommodation count
        if (data.connected) {
          try {
            const statusData = await fetchWithRetry(`/api/integrations/motopress/status?tenant_id=${tenantId}`)
            motoPresStatus.lastSync = statusData.last_sync_at ? new Date(statusData.last_sync_at) : undefined
            motoPresStatus.accommodationsCount = statusData.accommodations_count || 0
          } catch (error) {
            console.warn('Could not fetch MotoPress status:', error)
          }
        }
      } catch (error) {
        // Handle connection test failure
        const err = error instanceof Error ? error : new Error('Unknown error')

        if (err.message.includes('404')) {
          motoPresStatus.syncStatus = 'idle'
        } else {
          motoPresStatus.syncStatus = 'error'
          motoPresStatus.errorMessage = err.message || 'Failed to check connection'
        }
      }

      setIntegrations([motoPresStatus])
    } catch (error) {
      console.error('Error fetching integrations:', error)
      // Fallback to show unconfigured state
      setIntegrations([{
        id: 'motopress',
        name: 'MotoPress Hotel Booking',
        type: 'motopress',
        isActive: false,
        isConnected: false,
        syncStatus: 'error',
        accommodationsCount: 0,
        errorMessage: `Failed to load integration status${attemptCount > 1 ? ` (${attemptCount} attempts)` : ''}`
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (integration: IntegrationStatus) => {
    if (integration.syncStatus === 'syncing') {
      return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
    }
    if (integration.isConnected && integration.syncStatus === 'success') {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    if (integration.syncStatus === 'error') {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    }
    return <Settings className="h-4 w-4 text-gray-400" />
  }

  const getStatusBadge = (integration: IntegrationStatus) => {
    if (integration.syncStatus === 'syncing') {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Sincronizando</Badge>
    }
    if (integration.isConnected) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Conectado</Badge>
    }
    if (integration.syncStatus === 'error') {
      return <Badge variant="destructive">Error</Badge>
    }
    return <Badge variant="outline">No configurado</Badge>
  }

  const handleConfigure = (integration: IntegrationStatus) => {
    if (integration.type === 'motopress') {
      setShowMotoPresConfig(true)
    }
  }

  const handleConfigSaved = () => {
    // Refresh integrations data after configuration
    fetchIntegrations()
  }

  const handleImport = async (integration: IntegrationStatus) => {
    console.log('🚀 handleImport CALLED with integration:', integration)
    console.log('🔍 Current states:', {
      syncStatus: integration.syncStatus,
      isSyncStarting,
      tenantId,
      attemptCount
    })

    if (integration.syncStatus === 'syncing' || isSyncStarting) {
      console.log('❌ EARLY RETURN - Already syncing or starting')
      return
    }

    console.log('✅ Starting MotoPress sync for integration:', integration.id)

    // Set loading state to prevent multiple clicks
    setIsSyncStarting(true)

    // Update the integration status to show syncing state
    setIntegrations(prev => prev.map(i =>
      i.id === integration.id
        ? { ...i, syncStatus: 'syncing' as const, errorMessage: undefined }
        : i
    ))

    try {
      console.log('📡 Making POST request to /api/integrations/motopress/sync')
      console.log('📦 Request payload:', { tenant_id: tenantId })

      const result = await fetchWithRetry(`/api/integrations/motopress/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenant_id: tenantId }),
      })

      console.log('✅ Sync API response:', result)

      if (result.success) {
        console.log('🎉 Sync initiated successfully, opening progress modal')
        // Sync was initiated successfully, now show progress modal to track it
        setShowSyncProgress(true)

        // Call the optional onImport callback
        onImport?.(integration.type)
      } else {
        console.log('❌ Sync failed:', result.message)
        throw new Error(result.message || 'Sync failed to start')
      }
    } catch (error) {
      console.error('💥 Import error:', error)

      // Parse error to provide more specific user feedback
      let errorMessage = 'Import failed to start'

      if (error instanceof Error) {
        const errorText = error.message.toLowerCase()

        if (errorText.includes('connection test failed') || errorText.includes('401') || errorText.includes('invalid_username')) {
          errorMessage = 'Authentication failed. Please check your MotoPress credentials.'
        } else if (errorText.includes('404') || errorText.includes('not found')) {
          errorMessage = 'MotoPress API not found. Verify your site URL.'
        } else if (errorText.includes('timeout') || errorText.includes('network')) {
          errorMessage = 'Network error. Check your internet connection and try again.'
        } else if (errorText.includes('rate limit') || errorText.includes('429')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.'
        } else {
          errorMessage = error.message
        }
      }

      // Update error state and don't show progress modal
      setIntegrations(prev => prev.map(i =>
        i.id === integration.id
          ? {
              ...i,
              syncStatus: 'error' as const,
              errorMessage
            }
          : i
      ))

      // Ensure progress modal is not shown on error
      setShowSyncProgress(false)
    } finally {
      // Reset loading state
      setIsSyncStarting(false)
    }
  }

  const handleSyncProgressComplete = (result: any) => {
    console.log('Sync progress completed with result:', result)

    // Update the integrations status based on sync result
    setIntegrations(prev => prev.map(i =>
      i.type === 'motopress'
        ? {
            ...i,
            syncStatus: result.status === 'success' ? 'success' as const : 'error' as const,
            lastSync: new Date(),
            accommodationsCount: result.sync_details?.records_created + result.sync_details?.records_updated || result.records_created + result.records_updated || i.accommodationsCount,
            errorMessage: result.status === 'error' ? result.sync_details?.error_message || 'Sync completed with errors' : undefined
          }
        : i
    ))

    // Refresh integrations data
    fetchIntegrations()
  }

  const handleSyncProgressClose = () => {
    console.log('Sync progress modal closing')

    // Close the modal
    setShowSyncProgress(false)

    // Reset any lingering sync status if the sync isn't actually running
    // This prevents the UI from getting stuck in "syncing" state
    setTimeout(() => {
      setIntegrations(prev => prev.map(i =>
        i.type === 'motopress' && i.syncStatus === 'syncing'
          ? { ...i, syncStatus: 'idle' as const, errorMessage: undefined }
          : i
      ))
    }, 1000) // Small delay to allow any final updates to process
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Integraciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Integraciones Externas
          </div>
          <Badge variant="outline" className="text-xs">
            {integrations.filter(i => i.isConnected).length} de {integrations.length} activas
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                {getStatusIcon(integration)}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-sm">{integration.name}</h3>
                  {getStatusBadge(integration)}
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  {integration.accommodationsCount !== undefined && (
                    <div className="flex items-center">
                      <Database className="h-3 w-3 mr-1" />
                      {integration.accommodationsCount} alojamientos
                    </div>
                  )}
                  {integration.lastSync && (
                    <div>
                      Última sync: {integration.lastSync.toLocaleDateString()}
                    </div>
                  )}
                  {integration.errorMessage && (
                    <div className="text-red-500">
                      {integration.errorMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {!integration.isConnected ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleConfigure(integration)}
                  className="flex items-center space-x-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Configurar</span>
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleConfigure(integration)}
                    className="flex items-center space-x-1"
                  >
                    <Settings className="h-3 w-3" />
                    <span>Config</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      console.log('🖱️ Import button CLICKED for integration:', integration.id)
                      handleImport(integration)
                    }}
                    disabled={integration.syncStatus === 'syncing' || isSyncStarting}
                    className="flex items-center space-x-1"
                  >
                    {integration.syncStatus === 'syncing' || isSyncStarting ? (
                      <>
                        <Clock className="h-3 w-3 animate-spin" />
                        <span>
                          {isSyncStarting ? 'Iniciando...' : attemptCount > 1 ? `Reintento ${attemptCount}` : 'Importando'}
                        </span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3" />
                        <span>Importar</span>
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            <p className="mb-2">
              Las integraciones permiten sincronizar datos desde sistemas externos.
            </p>
            <p className="text-xs">
              Los datos se almacenan en el sistema InnPilot y están disponibles para búsquedas.
            </p>
          </div>
        </div>
      </CardContent>

      {/* Modal de configuración de MotoPress */}
      <MotoPresConfigModal
        isOpen={showMotoPresConfig}
        onClose={() => setShowMotoPresConfig(false)}
        tenantId={tenantId}
        onConfigSaved={handleConfigSaved}
      />

      {/* Modal de progreso de sincronización */}
      <SyncProgressModal
        isOpen={showSyncProgress}
        onClose={handleSyncProgressClose}
        tenantId={tenantId}
        onComplete={handleSyncProgressComplete}
      />
    </Card>
  )
}