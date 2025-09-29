'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2, Hotel, UtensilsCrossed, Camera, MapPin, Badge } from "lucide-react"

export interface Client {
  id: string
  name: string
  businessName: string
  businessType: string
  description: string
  recordCount: number
}

interface ClientSelectorProps {
  selectedClientId?: string
  selectedBusinessType?: string
  onClientChange: (clientId: string, client: Client) => void
  onBusinessTypeChange: (businessType: string) => void
  onClearFilters: () => void
}

// Active clients from the database (according to TODO.md)
const ACTIVE_CLIENTS: Client[] = [
  {
    id: 'simmerdown-hotels-uuid',
    name: 'SimmerDown Hotels',
    businessName: 'SimmerDown Hotel San Andrés',
    businessType: 'hotel',
    description: 'Hotel completo con amenidades y servicios premium',
    recordCount: 17
  },
  {
    id: 'boutique-island-resort-uuid',
    name: 'Boutique Island Resort',
    businessName: 'Boutique Island Resort',
    businessType: 'hotel',
    description: 'Hotel boutique con experiencia personalizada',
    recordCount: 3
  },
  {
    id: 'caribbean-flavors-uuid',
    name: 'Caribbean Flavors',
    businessName: 'Caribbean Flavors Restaurant',
    businessType: 'restaurant',
    description: 'Restaurante de especialidades caribeñas',
    recordCount: 2
  },
  {
    id: 'adventure-tours-sa-uuid',
    name: 'Adventure Tours SA',
    businessName: 'Adventure Tours San Andrés',
    businessType: 'activity',
    description: 'Operador de tours y actividades acuáticas',
    recordCount: 2
  }
]

const BUSINESS_TYPES = [
  { id: 'hotel', name: 'Hotel', icon: Hotel, color: 'blue' },
  { id: 'restaurant', name: 'Restaurante', icon: UtensilsCrossed, color: 'green' },
  { id: 'activity', name: 'Actividad', icon: Camera, color: 'purple' },
  { id: 'spot', name: 'Lugar', icon: MapPin, color: 'orange' },
  { id: 'rental', name: 'Alquiler', icon: Building2, color: 'red' },
  { id: 'nightlife', name: 'Vida Nocturna', icon: Badge, color: 'pink' },
  { id: 'museum', name: 'Museo', icon: Building2, color: 'indigo' },
  { id: 'store', name: 'Tienda', icon: Building2, color: 'gray' }
]

export function ClientSelector({
  selectedClientId,
  selectedBusinessType,
  onClientChange,
  onBusinessTypeChange,
  onClearFilters
}: ClientSelectorProps) {
  const selectedClient = ACTIVE_CLIENTS.find(c => c.id === selectedClientId)
  const selectedBusinessTypeInfo = BUSINESS_TYPES.find(bt => bt.id === selectedBusinessType)

  const getAvailableBusinessTypes = () => {
    if (!selectedClientId) {
      return BUSINESS_TYPES
    }

    const client = ACTIVE_CLIENTS.find(c => c.id === selectedClientId)
    if (client) {
      return BUSINESS_TYPES.filter(bt => bt.id === client.businessType)
    }

    return BUSINESS_TYPES
  }

  const getClientsForBusinessType = () => {
    if (!selectedBusinessType) {
      return ACTIVE_CLIENTS
    }

    return ACTIVE_CLIENTS.filter(c => c.businessType === selectedBusinessType)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Filtros Multi-Tenant</h3>
        {(selectedClientId || selectedBusinessType) && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
          >
            Limpiar Filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Client Selection */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-gray-600" />
                <label className="text-sm font-medium text-gray-700">
                  Cliente
                </label>
              </div>

              <Select
                value={selectedClientId || ''}
                onValueChange={(value) => {
                  const client = ACTIVE_CLIENTS.find(c => c.id === value)
                  if (client) {
                    onClientChange(value, client)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {getClientsForBusinessType().map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center space-x-2">
                        <div className="flex flex-col">
                          <span className="font-medium">{client.name}</span>
                          <span className="text-xs text-gray-500">
                            {client.businessName} ({client.recordCount} registros)
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedClient && (
                <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                  <div className="text-xs text-blue-700">
                    <div className="font-medium">{selectedClient.businessName}</div>
                    <div className="text-blue-600">{selectedClient.description}</div>
                    <div className="mt-1">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        {selectedClient.recordCount} registros disponibles
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Business Type Selection */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Badge className="h-4 w-4 text-gray-600" />
                <label className="text-sm font-medium text-gray-700">
                  Tipo de Negocio
                </label>
              </div>

              <Select
                value={selectedBusinessType || ''}
                onValueChange={onBusinessTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableBusinessTypes().map((businessType) => {
                    const Icon = businessType.icon
                    return (
                      <SelectItem key={businessType.id} value={businessType.id}>
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4 text-gray-600" />
                          <span>{businessType.name}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>

              {selectedBusinessTypeInfo && (
                <div className="mt-2 p-2 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <selectedBusinessTypeInfo.icon className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      {selectedBusinessTypeInfo.name}
                    </span>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Filtro activo para tipo de negocio
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Filters Summary */}
      {(selectedClientId || selectedBusinessType) && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Filtros Activos</h4>
              <div className="flex flex-wrap gap-2">
                {selectedClient && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Cliente: {selectedClient.name}
                  </span>
                )}
                {selectedBusinessTypeInfo && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Tipo: {selectedBusinessTypeInfo.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600">
                Las respuestas se filtrarán específicamente para el cliente y tipo de negocio seleccionados.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}