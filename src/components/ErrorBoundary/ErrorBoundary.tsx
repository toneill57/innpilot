'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  componentName?: string
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // In production, you might want to send this to a logging service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo, this.props.componentName)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Algo salió mal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                {this.props.componentName
                  ? `Hubo un error en el componente ${this.props.componentName}`
                  : 'Ocurrió un error inesperado'
                }
              </p>

              {this.props.showDetails && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Ver detalles técnicos
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto max-h-32">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col space-y-2 pt-4">
                <Button
                  onClick={this.handleRetry}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Intentar de nuevo
                </Button>

                <Button
                  onClick={this.handleReload}
                  className="w-full"
                  variant="outline"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Recargar página
                </Button>

                <Button
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                  variant="ghost"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Ir al inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Specialized Error Boundaries for different components
export const ChatErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    componentName="Chat Assistant"
    showDetails={process.env.NODE_ENV === 'development'}
    fallback={
      <div className="p-6 text-center border border-red-200 bg-red-50 rounded-lg">
        <MessageCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Error en el Chat
        </h3>
        <p className="text-red-600 mb-4">
          No se pudo cargar el asistente de chat. Intenta recargar la página.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Recargar
        </Button>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
)

export const MuvaErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    componentName="MUVA Assistant"
    showDetails={process.env.NODE_ENV === 'development'}
    fallback={
      <div className="p-8 text-center border border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg">
        <div className="text-4xl mb-3">🏝️</div>
        <h3 className="text-lg font-semibold text-orange-800 mb-2">
          MUVA no está disponible
        </h3>
        <p className="text-orange-600 mb-4">
          Nuestro asistente turístico está tomando un descanso. Intenta nuevamente en unos momentos.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline" className="border-orange-300">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reconectar con MUVA
        </Button>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
)

export const FileUploaderErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    componentName="File Uploader"
    showDetails={process.env.NODE_ENV === 'development'}
    fallback={
      <div className="p-6 text-center border border-blue-200 bg-blue-50 rounded-lg">
        <div className="text-4xl mb-3">📁</div>
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          Error en Subida de Archivos
        </h3>
        <p className="text-blue-600 mb-4">
          No se pudo cargar el sistema de subida de archivos. Verifica tu conexión.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline" className="border-blue-300">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
)