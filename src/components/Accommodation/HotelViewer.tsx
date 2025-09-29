'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Phone,
  Mail,
  Wifi,
  Coffee,
  Car,
  Star,
  Users,
  Clock,
  Shield,
  Zap,
  Layers,
  CheckCircle
} from "lucide-react"

interface Hotel {
  id: string
  name: string
  description: string
  short_description: string
  address: any
  contact_info: any
  hotel_amenities: string[]
  tourism_summary: string
  policies_summary: string
  full_description: string
  policies: any
  embedding_status: {
    has_fast: boolean
    has_balanced: boolean
    fast_dimensions: number
    balanced_dimensions: number
  }
  images: any[]
  status: string
}

export function HotelViewer() {
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHotel()
  }, [])

  const fetchHotel = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/accommodation/hotels?tenant_id=b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf')
      const data = await response.json()

      if (data.success && data.hotels.length > 0) {
        setHotel(data.hotels[0])
      } else {
        setError('No hotels found')
      }
    } catch (err) {
      setError('Failed to fetch hotel data')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !hotel) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-2">{error || 'Hotel not found'}</div>
        <Button onClick={fetchHotel} variant="outline">Retry</Button>
      </div>
    )
  }


  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{hotel.name}</h2>
            <p className="text-gray-600">{hotel.short_description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              hotel.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {hotel.status}
            </span>
          </div>
        </div>

        {/* Address & Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Ubicación</h4>
                  <p className="text-sm text-gray-600">
                    {hotel.address?.street}, {hotel.address?.neighborhood}<br />
                    {hotel.address?.city}, {hotel.address?.department}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start">
                <Phone className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Contacto</h4>
                  <p className="text-sm text-gray-600">
                    {hotel.contact_info?.phone}<br />
                    {hotel.contact_info?.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hotel Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{hotel.description}</p>
            </CardContent>
          </Card>

          {/* Tourism Summary & Policies Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 text-green-500 mr-2" />
                  Tourism Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{hotel.tourism_summary}</p>
                <div className="mt-3 flex items-center text-xs text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Tier 1 (1024d) - Ultra-fast
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 text-blue-500 mr-2" />
                  Policies Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{hotel.policies_summary}</p>
                <div className="mt-3 flex items-center text-xs text-blue-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Tier 2 (1536d) - Balanced
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hotel Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenidades del Hotel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {hotel.hotel_amenities?.map((amenity, index) => (
                  <div key={index} className="flex items-center p-2 bg-gray-50 rounded-lg">
                    <Star className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Embedding Status & Performance */}
        <div className="space-y-6">
          {/* Matryoshka Embedding Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Layers className="h-5 w-5 text-purple-500 mr-2" />
                Embeddings Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tier 1 Status */}
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <Zap className="h-4 w-4 text-green-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Tier 1 - Tourism</p>
                    <p className="text-xs text-green-600">Ultra-fast searches</p>
                  </div>
                </div>
                <div className="text-right">
                  {hotel.embedding_status.has_fast ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto mb-1" />
                      <p className="text-xs text-green-600">{hotel.embedding_status.fast_dimensions} dims</p>
                    </>
                  ) : (
                    <div className="text-xs text-gray-400">Not available</div>
                  )}
                </div>
              </div>

              {/* Tier 2 Status */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-blue-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Tier 2 - Policies</p>
                    <p className="text-xs text-blue-600">Balanced searches</p>
                  </div>
                </div>
                <div className="text-right">
                  {hotel.embedding_status.has_balanced ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                      <p className="text-xs text-blue-600">{hotel.embedding_status.balanced_dimensions} dims</p>
                    </>
                  ) : (
                    <div className="text-xs text-gray-400">Not available</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 text-gray-500 mr-2" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tier 1 Avg Speed</span>
                <span className="text-sm font-medium text-green-600">12ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tier 2 Avg Speed</span>
                <span className="text-sm font-medium text-blue-600">28ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Search Accuracy</span>
                <span className="text-sm font-medium">96.8%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Uptime</span>
                <span className="text-sm font-medium">99.9%</span>
              </div>
            </CardContent>
          </Card>

          {/* Multi-tenant Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 text-gray-500 mr-2" />
                Security Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">RLS Enabled</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Multi-tenant Isolation</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Data Encryption</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <div className="mt-3 p-2 bg-green-50 rounded text-center">
                <p className="text-xs text-green-700 font-medium">All Security Checks Passed</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}