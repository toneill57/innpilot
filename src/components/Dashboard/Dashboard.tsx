'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChatErrorBoundary, MuvaErrorBoundary } from "@/components/ErrorBoundary"
import {
  ChatAssistantLazy,
  MuvaAssistantLazy,
  ReportsTabLazy,
  useComponentPreloader
} from "@/components/LazyComponents"
import { FadeIn, StaggeredList, HoverCard, AnimatedCounter } from "@/components/Animations"
import { FileCheck, MessageCircle, Upload, BarChart3, Shield, Users, MapPin } from "lucide-react"

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<'upload' | 'chat' | 'muva' | 'reports'>('upload')
  const { preloadComponent } = useComponentPreloader()

  // Preload components on tab hover
  const handleTabHover = (tab: 'upload' | 'chat' | 'muva' | 'reports') => {
    switch (tab) {
      case 'chat':
        preloadComponent('dashboard')
        break
      case 'muva':
        preloadComponent('muva')
        break
      case 'reports':
        preloadComponent('reports')
        break
    }
  }

  const handleTabChange = (tab: 'upload' | 'chat' | 'muva' | 'reports') => {
    setActiveTab(tab)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <FadeIn direction="left" duration={600}>
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">InnPilot</h1>
                  <p className="text-sm text-gray-500">Plataforma de Gestión SIRE</p>
                </div>
              </div>
            </FadeIn>
            <FadeIn direction="right" duration={600} delay={200}>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Colombia</p>
                  <p className="text-xs text-gray-500">Gestión Hotelera</p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <StaggeredList
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          delay={150}
        >
          {[
            {
              title: "Reportes Enviados",
              value: 24,
              subtitle: "+2 desde ayer",
              icon: FileCheck
            },
            {
              title: "Validaciones OK",
              value: "98.5%",
              subtitle: "Tasa de éxito",
              icon: Shield
            },
            {
              title: "Consultas Chat",
              value: 156,
              subtitle: "Este mes",
              icon: MessageCircle
            },
            {
              title: "Huéspedes Reportados",
              value: 1247,
              subtitle: "Total registrados",
              icon: Users
            }
          ].map((stat, index) => (
            <HoverCard key={index} intensity="medium">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {typeof stat.value === 'number' ? (
                      <AnimatedCounter to={stat.value} />
                    ) : (
                      stat.value
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </CardContent>
              </Card>
            </HoverCard>
          ))}
        </StaggeredList>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => handleTabChange('upload')}
              onMouseEnter={() => handleTabHover('upload')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="inline h-4 w-4 mr-2" />
              Validar Archivos SIRE
            </button>
            <button
              onClick={() => handleTabChange('chat')}
              onMouseEnter={() => handleTabHover('chat')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'chat'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageCircle className="inline h-4 w-4 mr-2" />
              Asistente SIRE
            </button>
            <button
              onClick={() => handleTabChange('muva')}
              onMouseEnter={() => handleTabHover('muva')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'muva'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MapPin className="inline h-4 w-4 mr-2" />
              Asistente MUVA
            </button>
            <button
              onClick={() => handleTabChange('reports')}
              onMouseEnter={() => handleTabHover('reports')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="inline h-4 w-4 mr-2" />
              Reportes y Métricas
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <FadeIn direction="up" duration={400} delay={300}>
          <div className="bg-white rounded-lg shadow">
            {activeTab === 'upload' && (
              <div className="p-6">
                <FadeIn direction="up" delay={100}>
                  <div className="mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Validador de Archivos SIRE</h2>
                    <p className="text-sm text-gray-500">
                      Sube tu archivo TXT para validar el formato y contenido antes de enviarlo al SIRE
                    </p>
                  </div>
                </FadeIn>
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="text-2xl font-semibold leading-none tracking-tight">
                      Subir Archivo SIRE
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Arrastra tu archivo .txt aquí o haz clic para seleccionar
                    </p>
                  </div>
                  <div className="p-6 pt-0">
                    <div className="border-2 border-dashed rounded-lg p-8 text-center border-gray-300">
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Selecciona un archivo TXT
                      </p>
                      <p className="text-sm text-gray-500">
                        Formato SIRE con 13 campos separados por tabulaciones
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="p-6">
                <FadeIn direction="up" delay={100}>
                  <div className="mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Asistente SIRE</h2>
                    <p className="text-sm text-gray-500">
                      Consulta dudas sobre procedimientos, validaciones y compliance del SIRE
                    </p>
                  </div>
                </FadeIn>
                <ChatErrorBoundary>
                  <ChatAssistantLazy />
                </ChatErrorBoundary>
              </div>
            )}

            {activeTab === 'muva' && (
              <div className="p-6">
                <FadeIn direction="up" delay={100}>
                  <div className="mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Asistente MUVA</h2>
                    <p className="text-sm text-gray-500">
                      Guía turística especializada en San Andrés, Providencia y destinos colombianos
                    </p>
                  </div>
                </FadeIn>
                <MuvaErrorBoundary>
                  <MuvaAssistantLazy />
                </MuvaErrorBoundary>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="p-6">
                <ReportsTabLazy />
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </div>
  )
}