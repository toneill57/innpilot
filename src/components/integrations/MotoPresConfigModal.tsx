'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { MotoPresConfigurationForm } from './motopress/MotoPresConfigurationForm'

interface MotoPresConfigModalProps {
  isOpen: boolean
  onClose: () => void
  tenantId: string
  onConfigSaved?: () => void
}

interface MotoPresConfig {
  apiKey: string
  siteUrl: string
  isActive: boolean
}

export function MotoPresConfigModal({
  isOpen,
  onClose,
  tenantId,
  onConfigSaved
}: MotoPresConfigModalProps) {
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const handleSave = async (config: MotoPresConfig) => {
    setIsSaving(true)
    try {
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

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save configuration')
      }

      // Notificar éxito
      alert('Configuración guardada exitosamente')
      onConfigSaved?.()
      onClose()

    } catch (error: any) {
      console.error('Error saving configuration:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto relative">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Configuración de MotoPress
          </h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <MotoPresConfigurationForm
            tenantId={tenantId}
            onSave={handleSave}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  )
}