'use client'

import { useState } from 'react'
import { ClientSelector, Client } from '@/components/ClientSelector/ClientSelector'
import { EnhancedChatAssistant } from '@/components/ChatAssistant/EnhancedChatAssistant'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Filter, MessageSquare } from "lucide-react"

export function BusinessListingsInterface() {
  const [selectedClientId, setSelectedClientId] = useState<string>()
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>()
  const [selectedClient, setSelectedClient] = useState<Client>()

  const handleClientChange = (clientId: string, client: Client) => {
    setSelectedClientId(clientId)
    setSelectedClient(client)
    // Auto-select the business type from the client
    setSelectedBusinessType(client.businessType)
  }

  const handleBusinessTypeChange = (businessType: string) => {
    setSelectedBusinessType(businessType)
  }

  const handleClearFilters = () => {
    setSelectedClientId(undefined)
    setSelectedBusinessType(undefined)
    setSelectedClient(undefined)
  }

  const isConfigured = selectedClientId && selectedBusinessType

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Building2 className="h-6 w-6 text-purple-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Business Listings Assistant</h2>
          <p className="text-sm text-gray-600">
            Información específica filtrada por cliente y tipo de negocio
          </p>
        </div>
      </div>

      {/* Client and Business Type Selector */}
      <Card className="border-purple-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-purple-800">
            <Filter className="h-5 w-5" />
            <span>Configuración Multi-Tenant</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ClientSelector
            selectedClientId={selectedClientId}
            selectedBusinessType={selectedBusinessType}
            onClientChange={handleClientChange}
            onBusinessTypeChange={handleBusinessTypeChange}
            onClearFilters={handleClearFilters}
          />
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="border-purple-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-purple-800">
            <MessageSquare className="h-5 w-5" />
            <span>Chat Empresarial</span>
            {isConfigured && (
              <span className="text-sm font-normal text-purple-600">
                ({selectedClient?.name} - {selectedBusinessType})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isConfigured ? (
            <EnhancedChatAssistant
              chatType="business"
              filters={{
                clientId: selectedClientId,
                businessType: selectedBusinessType
              }}
            />
          ) : (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecciona un Cliente y Tipo de Negocio
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Para comenzar a chatear, selecciona primero un cliente específico y
                el tipo de negocio arriba. Esto permitirá que el asistente acceda
                a la información correcta para tus consultas.
              </p>
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    <span>SimmerDown Hotels (17 registros)</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <span>Caribbean Flavors (2 registros)</span>
                  </span>
                </div>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                    <span>Adventure Tours SA (2 registros)</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                    <span>Boutique Island (3 registros)</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      {isConfigured && (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="space-y-2">
              <h4 className="font-medium text-purple-900">
                💡 Preguntas sugeridas para {selectedClient?.name}
              </h4>
              <div className="text-sm text-purple-700 space-y-1">
                {selectedBusinessType === 'hotel' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>¿Qué amenidades ofrece el hotel?</li>
                    <li>¿Cuáles son las políticas de check-in y check-out?</li>
                    <li>¿Qué servicios están incluidos en la tarifa?</li>
                    <li>¿Cuáles son los horarios del restaurante?</li>
                  </ul>
                )}
                {selectedBusinessType === 'restaurant' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>¿Cuáles son las especialidades del menú?</li>
                    <li>¿Qué horarios de atención manejan?</li>
                    <li>¿Tienen opciones vegetarianas o veganas?</li>
                    <li>¿Cuáles son los precios promedio?</li>
                  </ul>
                )}
                {selectedBusinessType === 'activity' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>¿Qué actividades están disponibles?</li>
                    <li>¿Cuáles son los precios de los tours?</li>
                    <li>¿Qué equipo se incluye en las actividades?</li>
                    <li>¿Cuáles son los horarios de operación?</li>
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}