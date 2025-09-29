'use client'

import { EnhancedChatAssistant } from '@/components/ChatAssistant/EnhancedChatAssistant'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Camera, UtensilsCrossed, Car, Waves, Calendar, Sun, Map } from "lucide-react"

const TOURISM_CATEGORIES = [
  {
    id: 'beaches',
    name: 'Playas',
    icon: Waves,
    color: 'blue',
    description: 'Descubre las mejores playas de San Andrés',
    examples: ['¿Cuáles son las mejores playas?', '¿Dónde puedo hacer snorkel?']
  },
  {
    id: 'activities',
    name: 'Actividades',
    icon: Camera,
    color: 'green',
    description: 'Deportes acuáticos y aventuras',
    examples: ['¿Qué actividades acuáticas hay?', '¿Dónde puedo bucear?']
  },
  {
    id: 'restaurants',
    name: 'Restaurantes',
    icon: UtensilsCrossed,
    color: 'orange',
    description: 'Gastronomía local y internacional',
    examples: ['¿Dónde comer comida local?', '¿Cuáles son los mejores restaurantes?']
  },
  {
    id: 'transport',
    name: 'Transporte',
    icon: Car,
    color: 'purple',
    description: 'Movilidad en la isla',
    examples: ['¿Cómo moverme en la isla?', '¿Dónde alquilar transporte?']
  },
  {
    id: 'culture',
    name: 'Cultura',
    icon: Calendar,
    color: 'pink',
    description: 'Historia y cultura local',
    examples: ['¿Qué lugares históricos visitar?', '¿Cuál es la cultura local?']
  }
]

const QUICK_QUESTIONS = [
  "¿Cuáles son las mejores playas de San Andrés?",
  "¿Qué actividades acuáticas puedo hacer?",
  "¿Dónde puedo comer comida típica isleña?",
  "¿Cómo llego desde el aeropuerto al centro?",
  "¿Cuáles son los lugares más fotogénicos?",
  "¿Qué puedo hacer si llueve?",
  "¿Dónde puedo ver el atardecer?",
  "¿Cuáles son los precios promedio de actividades?"
]

export function TourismInterface() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg">
          <Map className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Tourism MUVA</h2>
          <p className="text-sm text-gray-600">
            Tu guía turística inteligente para San Andrés y Providencia
          </p>
        </div>
      </div>

      {/* Tourism Categories */}
      <Card className="border-green-200 bg-gradient-to-r from-blue-50 to-green-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <MapPin className="h-5 w-5" />
            <span>Categorías Turísticas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOURISM_CATEGORIES.map((category) => {
              const Icon = category.icon
              return (
                <Card
                  key={category.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 bg-white border-${category.color}-200`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-2 rounded-lg bg-${category.color}-100`}>
                        <Icon className={`h-5 w-5 text-${category.color}-600`} />
                      </div>
                      <div>
                        <h3 className={`font-medium text-${category.color}-900`}>
                          {category.name}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {category.description}
                    </p>
                    <div className="space-y-1">
                      {category.examples.map((example, idx) => (
                        <div key={idx} className="text-xs text-gray-500 italic">
                          "{example}"
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Questions */}
      <Card className="border-blue-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Sun className="h-5 w-5" />
            <span>Preguntas Rápidas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {QUICK_QUESTIONS.map((question, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="h-auto p-3 text-left justify-start text-xs hover:bg-blue-50 border border-blue-100"
              >
                <span className="text-blue-600 mr-2">•</span>
                {question}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="border-green-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <MapPin className="h-5 w-5" />
            <span>Asistente Turístico</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedChatAssistant chatType="tourism" />
        </CardContent>
      </Card>

      {/* Tourism Stats */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">37</div>
              <div className="text-sm text-blue-700">Registros Turísticos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">18</div>
              <div className="text-sm text-green-700">Actividades</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">6</div>
              <div className="text-sm text-orange-700">Restaurantes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">3</div>
              <div className="text-sm text-purple-700">Opciones de Transporte</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Base de datos actualizada con información turística de San Andrés
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Sun className="h-5 w-5 text-yellow-600 mt-1" />
            <div>
              <h4 className="font-medium text-yellow-900 mb-2">
                💡 Tips para tu visita a San Andrés
              </h4>
              <div className="text-sm text-yellow-800 space-y-1">
                <p>• <strong>Mejor época:</strong> Diciembre a abril (temporada seca)</p>
                <p>• <strong>Moneda:</strong> Peso colombiano (COP)</p>
                <p>• <strong>Idioma:</strong> Español e inglés (algunos locales hablan creole)</p>
                <p>• <strong>Transporte:</strong> Carritos de golf, motos y taxis</p>
                <p>• <strong>Especialidad:</strong> Pescado frito, rice & beans, patacón</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}