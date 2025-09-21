'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  FileCheck,
  AlertTriangle,
  TrendingUp,
  Clock,
  Download,
  RefreshCw,
  Calendar,
  Users,
  MessageCircle,
  MapPin,
  Filter,
  Search
} from "lucide-react"

interface ValidationResult {
  id: string
  fileName: string
  status: 'success' | 'warning' | 'error'
  timestamp: Date
  errors: number
  warnings: number
  size: string
  processingTime: number
}

interface ChatMetrics {
  totalQueries: number
  sireQueries: number
  muvaQueries: number
  avgResponseTime: number
  popularQuestions: string[]
  satisfactionRate: number
}

interface SystemMetrics {
  uptime: string
  totalUsers: number
  activeToday: number
  errorRate: number
  avgLoadTime: number
}

export function ReportsTab() {
  const [activeView, setActiveView] = useState<'overview' | 'validations' | 'chat' | 'system'>('overview')
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d')

  // Mock data - in real implementation, this would come from API
  const validationResults: ValidationResult[] = [
    {
      id: '1',
      fileName: 'hotel_data_2024.txt',
      status: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      errors: 0,
      warnings: 2,
      size: '2.4 MB',
      processingTime: 1200
    },
    {
      id: '2',
      fileName: 'registros_enero.txt',
      status: 'warning',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      errors: 0,
      warnings: 5,
      size: '1.8 MB',
      processingTime: 980
    },
    {
      id: '3',
      fileName: 'datos_huespedes.txt',
      status: 'error',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
      errors: 3,
      warnings: 1,
      size: '3.1 MB',
      processingTime: 1450
    }
  ]

  const chatMetrics: ChatMetrics = {
    totalQueries: 1247,
    sireQueries: 832,
    muvaQueries: 415,
    avgResponseTime: 2.3,
    popularQuestions: [
      "¿Cuáles son los 13 campos obligatorios del SIRE?",
      "¿Qué restaurantes recomiendas en San Andrés?",
      "¿Cómo valido mi archivo antes de enviarlo?",
      "¿Cuáles son las mejores playas para bucear?",
      "¿Qué formato debe tener el archivo TXT?"
    ],
    satisfactionRate: 4.6
  }

  const systemMetrics: SystemMetrics = {
    uptime: "99.8%",
    totalUsers: 342,
    activeToday: 28,
    errorRate: 0.2,
    avgLoadTime: 1.8
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(timestamp)
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes y Métricas</h2>
          <p className="text-gray-600">Dashboard de análisis y rendimiento del sistema</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="24h">Últimas 24h</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
          </select>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Resumen', icon: BarChart3 },
            { id: 'validations', label: 'Validaciones', icon: FileCheck },
            { id: 'chat', label: 'Chat Assistant', icon: MessageCircle },
            { id: 'system', label: 'Sistema', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="inline h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeView === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Validaciones Totales</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">247</div>
              <p className="text-xs text-muted-foreground">+12% vs mes anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consultas Chat</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chatMetrics.totalQueries.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">SIRE: {chatMetrics.sireQueries} | MUVA: {chatMetrics.muvaQueries}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.activeToday}</div>
              <p className="text-xs text-muted-foreground">de {systemMetrics.totalUsers} totales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.uptime}</div>
              <p className="text-xs text-muted-foreground">Últimos 30 días</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Validations Tab */}
      {activeView === 'validations' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Validaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {validationResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Badge className={getStatusColor(result.status)}>
                        {result.status === 'success' && 'Exitoso'}
                        {result.status === 'warning' && 'Advertencias'}
                        {result.status === 'error' && 'Errores'}
                      </Badge>
                      <div>
                        <p className="font-medium">{result.fileName}</p>
                        <p className="text-sm text-gray-500">
                          {formatTimestamp(result.timestamp)} • {result.size} • {result.processingTime}ms
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {result.errors > 0 && (
                        <span className="text-red-600 text-sm">{result.errors} errores</span>
                      )}
                      {result.warnings > 0 && (
                        <span className="text-yellow-600 text-sm">{result.warnings} advertencias</span>
                      )}
                      <Button variant="outline" size="sm">
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chat Tab */}
      {activeView === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Chat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Tiempo promedio de respuesta</span>
                <span className="font-semibold">{chatMetrics.avgResponseTime}s</span>
              </div>
              <div className="flex justify-between">
                <span>Satisfacción promedio</span>
                <span className="font-semibold">{chatMetrics.satisfactionRate}/5 ⭐</span>
              </div>
              <div className="pt-4">
                <h4 className="font-medium mb-2">Distribución por Asistente</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-blue-600">SIRE Assistant</span>
                    <span>{Math.round((chatMetrics.sireQueries / chatMetrics.totalQueries) * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">MUVA Assistant</span>
                    <span>{Math.round((chatMetrics.muvaQueries / chatMetrics.totalQueries) * 100)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preguntas Populares</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {chatMetrics.popularQuestions.map((question, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <span className="text-sm text-gray-500 mt-1">{index + 1}.</span>
                    <p className="text-sm">{question}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Tab */}
      {activeView === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Tiempo de carga promedio</span>
                <span className="font-semibold">{systemMetrics.avgLoadTime}s</span>
              </div>
              <div className="flex justify-between">
                <span>Tasa de errores</span>
                <span className="font-semibold">{systemMetrics.errorRate}%</span>
              </div>
              <div className="flex justify-between">
                <span>Uptime</span>
                <span className="font-semibold text-green-600">{systemMetrics.uptime}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividad de Usuarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Usuarios registrados</span>
                <span className="font-semibold">{systemMetrics.totalUsers}</span>
              </div>
              <div className="flex justify-between">
                <span>Activos hoy</span>
                <span className="font-semibold">{systemMetrics.activeToday}</span>
              </div>
              <div className="flex justify-between">
                <span>Tasa de actividad</span>
                <span className="font-semibold">
                  {Math.round((systemMetrics.activeToday / systemMetrics.totalUsers) * 100)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}