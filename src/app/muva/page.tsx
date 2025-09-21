'use client'

import { MuvaAssistantLazy } from "@/components/LazyComponents"
import { MuvaErrorBoundary } from "@/components/ErrorBoundary"
import { MapPin, Sun, Waves, Palmtree } from "lucide-react"
import Link from "next/link"

export default function MuvaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-cyan-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span className="text-sm">← Volver a InnPilot</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center">
                <div className="flex items-center space-x-2 mr-3">
                  <Sun className="h-6 w-6 text-yellow-500" />
                  <Waves className="h-6 w-6 text-cyan-500" />
                  <Palmtree className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                    MUVA
                  </h1>
                  <p className="text-sm text-gray-600">Asistente Turístico de San Andrés</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-cyan-600" />
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">San Andrés, Colombia</p>
                <p className="text-xs text-gray-500">Islas del Caribe</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500 py-12">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Descubre San Andrés
          </h2>
          <p className="text-xl text-cyan-100 mb-6 max-w-2xl mx-auto">
            Tu asistente inteligente para explorar el paraíso caribeño.
            Encuentra restaurantes, playas, hoteles y experiencias únicas.
          </p>
          <div className="flex justify-center items-center space-x-6 text-cyan-100">
            <div className="flex items-center space-x-2">
              <Sun className="h-5 w-5" />
              <span className="text-sm">Clima Tropical</span>
            </div>
            <div className="flex items-center space-x-2">
              <Waves className="h-5 w-5" />
              <span className="text-sm">Mar Caribe</span>
            </div>
            <div className="flex items-center space-x-2">
              <Palmtree className="h-5 w-5" />
              <span className="text-sm">Cultura Raizal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-cyan-200 overflow-hidden">
          <MuvaErrorBoundary>
            <MuvaAssistantLazy />
          </MuvaErrorBoundary>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-cyan-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">Potenciado por InnPilot - Gestión Hotelera Inteligente</span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>San Andrés y Providencia</span>
              <span>•</span>
              <span>Colombia</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}