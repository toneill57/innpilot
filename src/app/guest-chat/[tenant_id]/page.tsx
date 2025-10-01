'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GuestLogin } from '@/components/Chat/GuestLogin'
import { GuestChatInterface } from '@/components/Chat/GuestChatInterface'
import type { GuestSession } from '@/lib/guest-auth'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Guest Chat Page Component
 *
 * Dynamic route for tenant-specific guest chat with error boundary and session management
 * Note: This is a client component for state management (localStorage, session)
 */
export default function GuestChatPage({ params }: { params: Promise<{ tenant_id: string }> }) {
  // Unwrap params Promise (Next.js 15)
  const { tenant_id: tenantSlugOrUuid } = use(params)

  const [tenantId, setTenantId] = useState<string | null>(null)
  const [session, setSession] = useState<GuestSession | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Step 1: Resolve tenant slug/UUID on mount
  useEffect(() => {
    const resolveTenant = async () => {
      try {
        const response = await fetch('/api/tenant/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slugOrUuid: tenantSlugOrUuid }),
        })

        if (!response.ok) {
          throw new Error('Tenant not found')
        }

        const { tenant_id } = await response.json()
        setTenantId(tenant_id)
      } catch (err) {
        console.error('Failed to resolve tenant:', err)
        setError('Hotel no encontrado. Verifica la URL.')
        setLoading(false)
      }
    }

    resolveTenant()
  }, [tenantSlugOrUuid])

  // Step 2: Session persistence - Load JWT from localStorage
  useEffect(() => {
    if (!tenantId) return // Wait for tenant resolution

    const loadSession = async () => {
      try {
        const storedToken = localStorage.getItem('guest_token')
        if (storedToken) {
          // Verify token via server-side API (where JWT_SECRET is available)
          const response = await fetch('/api/guest/verify-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: storedToken })
          })

          if (response.ok) {
            const { session: verifiedSession } = await response.json()
            setSession(verifiedSession)
            setToken(storedToken)
          } else {
            // Token invalid or expired, clear it
            localStorage.removeItem('guest_token')
          }
        }
      } catch (err) {
        console.error('Failed to load session:', err)
        localStorage.removeItem('guest_token')
        setError('Error al cargar la sesión. Por favor, inicia sesión nuevamente.')
      } finally {
        setLoading(false)
      }
    }

    loadSession()
  }, [tenantId])

  const handleLoginSuccess = (newSession: GuestSession, newToken: string) => {
    localStorage.setItem('guest_token', newToken)
    setSession(newSession)
    setToken(newToken)
  }

  const handleLogout = () => {
    localStorage.removeItem('guest_token')
    setSession(null)
    setToken(null)
    setError(null)
    router.refresh()
  }

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    window.location.reload()
  }

  // Error state
  if (error && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-lg shadow-lg p-6 text-center">
          <div className="mb-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={handleRetry}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Not logged in - show login screen
  if (!session || !token) {
    // Wait for tenant resolution before showing login
    if (!tenantId) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      )
    }

    return <GuestLogin tenantId={tenantId} onLoginSuccess={handleLoginSuccess} />
  }

  // Logged in - show chat interface
  return <GuestChatInterface session={session} token={token} onLogout={handleLogout} />
}
