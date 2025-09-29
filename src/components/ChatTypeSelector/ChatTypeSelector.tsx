'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MessageCircle, MapPin, Building2, Users } from "lucide-react"

export type ChatType = 'sire' | 'tourism' | 'business'

interface ChatTypeSelectorProps {
  activeType: ChatType
  onTypeChange: (type: ChatType) => void
}

const CHAT_TYPES = [
  {
    id: 'sire' as ChatType,
    name: 'SIRE Assistant',
    description: 'Consultas sobre compliance y procedimientos SIRE',
    icon: MessageCircle,
    color: 'blue',
    badge: 'Compliance'
  },
  {
    id: 'tourism' as ChatType,
    name: 'Tourism MUVA',
    description: 'Información turística de San Andrés y alrededores',
    icon: MapPin,
    color: 'green',
    badge: 'Turismo'
  },
  {
    id: 'business' as ChatType,
    name: 'Business Listings',
    description: 'Información específica de hoteles, restaurantes y actividades',
    icon: Building2,
    color: 'purple',
    badge: 'Multi-Tenant'
  }
]

export function ChatTypeSelector({ activeType, onTypeChange }: ChatTypeSelectorProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center mb-4">
        <Users className="h-5 w-5 text-gray-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Tipo de Asistente</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CHAT_TYPES.map((type) => {
          const Icon = type.icon
          const isActive = activeType === type.id

          return (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isActive
                  ? `ring-2 ring-${type.color}-500 bg-${type.color}-50`
                  : 'hover:shadow-lg'
              }`}
              onClick={() => onTypeChange(type.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${
                      isActive
                        ? `bg-${type.color}-100`
                        : 'bg-gray-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        isActive
                          ? `text-${type.color}-600`
                          : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="ml-3">
                      <h4 className={`font-medium ${
                        isActive
                          ? `text-${type.color}-900`
                          : 'text-gray-900'
                      }`}>
                        {type.name}
                      </h4>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    isActive
                      ? `bg-${type.color}-100 text-${type.color}-700`
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {type.badge}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {type.description}
                </p>
                {isActive && (
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <div className={`flex items-center text-xs font-medium text-${type.color}-600`}>
                      <div className={`w-2 h-2 bg-${type.color}-500 rounded-full mr-2`}></div>
                      Activo
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}