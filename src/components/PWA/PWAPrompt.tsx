'use client'

import { useState, useEffect } from 'react'
import { usePWA } from '@/hooks/usePWA'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, Download, Smartphone, Wifi, WifiOff } from 'lucide-react'

export function PWAInstallPrompt() {
  const { isInstallable, showInstallPrompt, install, dismissInstallPrompt } = usePWA()
  const [isDismissed, setIsDismissed] = useState(false)

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (showInstallPrompt) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [showInstallPrompt])

  const handleInstall = async () => {
    await install()
    setIsDismissed(true)
  }

  const handleDismiss = () => {
    dismissInstallPrompt()
    setIsDismissed(true)
  }

  if (!isInstallable || !showInstallPrompt || isDismissed) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-2">
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Instalar InnPilot
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Accede rápidamente desde tu pantalla de inicio. Funciona offline y recibe notificaciones.
              </p>

              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Instalar
                </Button>
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  variant="ghost"
                  className="text-gray-500 hover:text-gray-700"
                >
                  Más tarde
                </Button>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function PWAOfflineIndicator() {
  const { isOnline } = usePWA()
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineMessage(true)
      const timer = setTimeout(() => {
        setShowOfflineMessage(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isOnline])

  if (isOnline || !showOfflineMessage) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-96 z-50 animate-in slide-in-from-top-2">
      <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 shadow-lg">
        <CardContent className="p-3">
          <div className="flex items-center space-x-3">
            <WifiOff className="h-5 w-5 text-orange-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-800">
                Sin conexión
              </p>
              <p className="text-xs text-orange-600">
                Algunas funciones están limitadas. Se reconectará automáticamente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function PWAUpdatePrompt() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setShowUpdatePrompt(true)
      })
    }
  }, [])

  const handleUpdate = async () => {
    setIsUpdating(true)

    try {
      // Force refresh to load new version
      window.location.reload()
    } catch (error) {
      console.error('Error updating app:', error)
      setIsUpdating(false)
    }
  }

  const handleDismiss = () => {
    setShowUpdatePrompt(false)
  }

  if (!showUpdatePrompt) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-96 z-50 animate-in slide-in-from-top-2">
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Download className="h-4 w-4 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Actualización disponible
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Una nueva versión de InnPilot está lista. Actualiza para obtener las últimas mejoras.
              </p>

              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleUpdate}
                  size="sm"
                  disabled={isUpdating}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isUpdating ? 'Actualizando...' : 'Actualizar'}
                </Button>
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  variant="ghost"
                  className="text-gray-500 hover:text-gray-700"
                >
                  Más tarde
                </Button>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}