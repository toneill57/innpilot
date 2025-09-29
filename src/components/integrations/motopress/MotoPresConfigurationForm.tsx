'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Save,
  TestTube
} from "lucide-react"

interface MotoPresConfigFormProps {
  tenantId: string
  onSave?: (config: MotoPresConfig) => void
  onCancel?: () => void
  initialConfig?: MotoPresConfig
}

interface MotoPresConfig {
  apiKey: string
  siteUrl: string
  isActive: boolean
}

interface TestResult {
  isConnected: boolean
  message: string
  accommodationsCount?: number
  error?: string
}

export function MotoPresConfigurationForm({
  tenantId,
  onSave,
  onCancel,
  initialConfig
}: MotoPresConfigFormProps) {
  const [config, setConfig] = useState<MotoPresConfig>(
    initialConfig || {
      apiKey: '',
      siteUrl: '',
      isActive: false
    }
  )

  const [showApiKey, setShowApiKey] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  const handleInputChange = (field: keyof MotoPresConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }))
    setTestResult(null) // Clear test result when config changes
  }

  const handleTestConnection = async () => {
    if (!config.apiKey || !config.siteUrl) {
      setTestResult({
        isConnected: false,
        message: 'Por favor ingresa la API Key y URL del sitio',
        error: 'Campos requeridos vacíos'
      })
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      // Conexión real con la API de MotoPress
      const response = await fetch('/api/integrations/motopress/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          api_key: config.apiKey,
          site_url: config.siteUrl
        })
      })

      const result = await response.json()

      if (result.connected) {
        setTestResult({
          isConnected: true,
          message: result.message || 'Conexión exitosa',
          accommodationsCount: result.accommodations_count || 0
        })
      } else {
        setTestResult({
          isConnected: false,
          message: result.message || 'Error de conexión',
          error: result.error || 'No se pudo conectar con MotoPress'
        })
      }
    } catch (error: any) {
      setTestResult({
        isConnected: false,
        message: 'Error de red',
        error: error.message || 'No se pudo conectar al servidor'
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async () => {
    if (!testResult?.isConnected) {
      alert('Por favor prueba la conexión exitosamente antes de guardar')
      return
    }

    setIsSaving(true)
    try {
      // Llamada real a la API de configuración
      const response = await fetch('/api/integrations/motopress/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          api_key: config.apiKey,
          site_url: config.siteUrl,
          is_active: config.isActive
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        onSave?.(config)
      } else {
        throw new Error(result.error || 'Error al guardar la configuración')
      }
    } catch (error: any) {
      console.error('Error saving config:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const isFormValid = config.apiKey && config.siteUrl
  const canSave = isFormValid && testResult?.isConnected

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Configuración MotoPress</span>
          <Badge variant="outline" className="text-xs">
            Tenant: {tenantId}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL del Sitio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL del Sitio Web
          </label>
          <input
            type="url"
            placeholder="https://simmerdown.house"
            value={config.siteUrl}
            onChange={(e) => handleInputChange('siteUrl', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            URL completa donde está instalado MotoPress Hotel Booking
          </p>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key de MotoPress
          </label>
          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              placeholder="Ingresa tu API key de MotoPress"
              value={config.apiKey}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showApiKey ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            API key de tu instalación de MotoPress. La encontrarás en WP Admin → MotoPress Hotel Booking → Settings → API
          </p>
        </div>

        {/* Test de Conexión */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Prueba de Conexión</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestConnection}
              disabled={!isFormValid || isTesting}
              className="flex items-center space-x-2"
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              <span>{isTesting ? 'Probando...' : 'Probar Conexión'}</span>
            </Button>
          </div>

          {testResult && (
            <div className={`flex items-start space-x-3 p-3 rounded-lg ${
              testResult.isConnected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {testResult.isConnected ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  testResult.isConnected ? 'text-green-800' : 'text-red-800'
                }`}>
                  {testResult.message}
                </p>
                {testResult.accommodationsCount && (
                  <p className="text-xs text-green-600 mt-1">
                    {testResult.accommodationsCount} alojamientos encontrados
                  </p>
                )}
                {testResult.error && (
                  <p className="text-xs text-red-600 mt-1">
                    {testResult.error}
                  </p>
                )}
              </div>
            </div>
          )}

          {!testResult && isFormValid && (
            <p className="text-xs text-gray-500">
              Haz clic en "Probar Conexión" para verificar que la configuración es correcta
            </p>
          )}
        </div>

        {/* Estado Activo */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Activar Integración</h3>
            <p className="text-xs text-gray-500">
              Permite la sincronización automática de datos
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Información Adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">ℹ️ Información</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• La integración sincroniza alojamientos, precios y disponibilidad</li>
            <li>• Los datos se almacenan en InnPilot y están disponibles para búsquedas</li>
            <li>• La sincronización se puede hacer manual o automática</li>
            <li>• Todos los datos siguen las políticas de seguridad multi-tenant</li>
          </ul>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className="flex items-center space-x-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isSaving ? 'Guardando...' : 'Guardar Configuración'}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}