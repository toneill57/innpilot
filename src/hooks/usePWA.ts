'use client'

import { useEffect, useState } from 'react'

interface PWAState {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  showInstallPrompt: boolean
}

interface PWAActions {
  install: () => Promise<void>
  dismissInstallPrompt: () => void
  showInstallPrompt: () => void
}

export function usePWA(): PWAState & PWAActions {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    showInstallPrompt: false
  })

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Check if running in standalone mode (installed PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://')

    setState(prev => ({ ...prev, isInstalled: isStandalone }))

    // Service Worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered successfully:', registration)

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available
                  console.log('New SW version available')
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('SW registration failed:', error)
        })
    }

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setState(prev => ({ ...prev, isInstallable: true }))

      // Auto-show install prompt after 30 seconds if not dismissed
      setTimeout(() => {
        setState(prev => ({ ...prev, showInstallPrompt: true }))
      }, 30000)
    }

    // Handle app installed
    const handleAppInstalled = () => {
      console.log('PWA was installed')
      setState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        showInstallPrompt: false
      }))
      setDeferredPrompt(null)
    }

    // Online/Offline status
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }))

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('User accepted PWA install')
      } else {
        console.log('User dismissed PWA install')
      }
    } catch (error) {
      console.error('Error during PWA install:', error)
    } finally {
      setDeferredPrompt(null)
      setState(prev => ({ ...prev, showInstallPrompt: false }))
    }
  }

  const dismissInstallPrompt = () => {
    setState(prev => ({ ...prev, showInstallPrompt: false }))
  }

  const showInstallPrompt = () => {
    if (state.isInstallable) {
      setState(prev => ({ ...prev, showInstallPrompt: true }))
    }
  }

  return {
    ...state,
    install,
    dismissInstallPrompt,
    showInstallPrompt
  }
}

// Hook for checking PWA capabilities
export function usePWACapabilities() {
  const [capabilities, setCapabilities] = useState({
    serviceWorker: false,
    pushNotifications: false,
    backgroundSync: false,
    persistentStorage: false
  })

  useEffect(() => {
    const checkCapabilities = async () => {
      const newCapabilities = {
        serviceWorker: 'serviceWorker' in navigator,
        pushNotifications: 'PushManager' in window,
        backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
        persistentStorage: 'storage' in navigator && 'persist' in navigator.storage
      }

      setCapabilities(newCapabilities)

      // Request persistent storage if available
      if (newCapabilities.persistentStorage) {
        try {
          const granted = await navigator.storage.persist()
          console.log('Persistent storage:', granted ? 'granted' : 'denied')
        } catch (error) {
          console.error('Error requesting persistent storage:', error)
        }
      }
    }

    checkCapabilities()
  }, [])

  return capabilities
}