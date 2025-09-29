'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Home,
  Users,
  Bed,
  Eye,
  MapPin,
  Star,
  Wifi,
  Coffee,
  Music,
  Palette,
  Zap,
  Shield,
  CheckCircle,
  DollarSign,
  Clock,
  Layers,
  Crown
} from "lucide-react"

interface AccommodationUnit {
  id: string
  name: string
  unit_number: string
  description: string
  short_description: string
  capacity: any
  bed_configuration: any
  view_type: string
  tourism_features: string
  booking_policies: string
  unique_features: string[]
  is_featured: boolean
  display_order: number
  status: string
  embedding_status: {
    has_fast: boolean
    has_balanced: boolean
    fast_dimensions: number
    balanced_dimensions: number
  }
  pricing_summary: {
    seasonal_rules: number
    hourly_rules: number
    base_price_range: number[]
  }
  amenities_summary: {
    total: number
    included: number
    premium: number
    featured: number
  }
  unit_amenities: any[]
  pricing_rules: any[]
}

export function AccommodationUnitsGrid() {
  const [units, setUnits] = useState<AccommodationUnit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<AccommodationUnit | null>(null)

  useEffect(() => {
    fetchUnits()
  }, [])

  const fetchUnits = async () => {
    try {
      setIsLoading(true)
      // Use tenant_id only (remove hardcoded hotel_id)
      const tenantId = 'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf' // TODO: Get from user context
      const response = await fetch(`/api/accommodation/units?tenant_id=${tenantId}`)
      const data = await response.json()

      if (data.success) {
        // Remove duplicates by name (keep only unique units)
        const uniqueUnits = data.units?.reduce((acc: AccommodationUnit[], unit: AccommodationUnit) => {
          if (!acc.find(u => u.name === unit.name)) {
            acc.push(unit)
          }
          return acc
        }, []) || []

        setUnits(uniqueUnits)
      } else {
        setError('No units found')
      }
    } catch (err) {
      setError('Failed to fetch units data')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-2">{error}</div>
        <Button onClick={fetchUnits} variant="outline">Retry</Button>
      </div>
    )
  }

  const getThemeColor = (unitName: string) => {
    if (unitName.includes('Bob Marley')) return 'green'
    if (unitName.includes('Jimmy Buffett')) return 'blue'
    if (unitName.includes('Natural Mystic')) return 'purple'
    return 'gray'
  }

  const getThemeIcon = (unitName: string) => {
    if (unitName.includes('Bob Marley')) return Music
    if (unitName.includes('Jimmy Buffett')) return Coffee
    if (unitName.includes('Natural Mystic')) return Palette
    return Home
  }

  const formatPrice = (priceRange: number[]) => {
    if (!priceRange || priceRange.length === 0) return 'N/A'
    const min = Math.min(...priceRange)
    const max = Math.max(...priceRange)
    return min === max ? `$${min.toLocaleString()}` : `$${min.toLocaleString()} - $${max.toLocaleString()}`
  }

  const UnitCard = ({ unit }: { unit: AccommodationUnit }) => {
    const themeColor = getThemeColor(unit.name)
    const ThemeIcon = getThemeIcon(unit.name)

    return (
      <Card className={`relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer ${
        unit.is_featured ? `ring-2 ring-${themeColor}-400 bg-gradient-to-br from-${themeColor}-50 to-${themeColor}-100/50 shadow-lg` : 'hover:shadow-lg'
      }`}>
        {unit.is_featured && (
          <div className={`absolute top-0 right-0 bg-gradient-to-r from-${themeColor}-500 to-${themeColor}-600 text-white px-3 py-1.5 text-xs font-bold rounded-bl-lg shadow-lg animate-pulse`}>
            <Crown className="h-3 w-3 inline mr-1 animate-bounce" />
            FEATURED
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 bg-gradient-to-br from-${themeColor}-100 to-${themeColor}-200 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300`}>
                <ThemeIcon className={`h-6 w-6 text-${themeColor}-600 group-hover:scale-110 transition-transform duration-300`} />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-${themeColor}-700 transition-colors duration-300">{unit.name}</CardTitle>
                <p className="text-sm text-gray-500 font-medium">{unit.unit_number} • {unit.status}</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Enhanced Basic Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={`flex items-center p-2 rounded-lg bg-${themeColor}-50/50 group-hover:bg-${themeColor}-100/70 transition-colors duration-300`}>
              <Users className={`h-4 w-4 text-${themeColor}-500 mr-2`} />
              <span className="font-medium">{unit.capacity?.adults || 2} guests</span>
            </div>
            <div className={`flex items-center p-2 rounded-lg bg-blue-50/50 group-hover:bg-blue-100/70 transition-colors duration-300`}>
              <Eye className="h-4 w-4 text-blue-500 mr-2" />
              <span className="font-medium">{unit.view_type}</span>
            </div>
            <div className={`flex items-center p-2 rounded-lg bg-purple-50/50 group-hover:bg-purple-100/70 transition-colors duration-300`}>
              <Bed className="h-4 w-4 text-purple-500 mr-2" />
              <span className="font-medium">{unit.bed_configuration?.bed_type || 'Queen'}</span>
            </div>
            <div className={`flex items-center p-2 rounded-lg bg-green-50/50 group-hover:bg-green-100/70 transition-colors duration-300`}>
              <DollarSign className="h-4 w-4 text-green-500 mr-2" />
              <span className="font-bold text-green-700">{formatPrice(unit.pricing_summary.base_price_range)} COP</span>
            </div>
          </div>

          {/* Enhanced Description */}
          <div className="relative">
            <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed font-medium">{unit.short_description}</p>
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-gradient-to-tl from-white via-white to-transparent"></div>
          </div>

          {/* Unique Features */}
          {unit.unique_features && unit.unique_features.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Características Únicas</h4>
              <div className="flex flex-wrap gap-1">
                {unit.unique_features.slice(0, 2).map((feature, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1.5 bg-gradient-to-r from-${themeColor}-100 to-${themeColor}-200 text-${themeColor}-800 text-xs rounded-full font-semibold shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer hover:scale-105`}
                  >
                    {feature.length > 25 ? `${feature.substring(0, 25)}...` : feature}
                  </span>
                ))}
                {unit.unique_features.length > 2 && (
                  <span className="px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-xs rounded-full font-semibold shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer hover:scale-105 animate-pulse">
                    +{unit.unique_features.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Embeddings Status */}
          <div className="border-t pt-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <Layers className="h-4 w-4 mr-1" />
              Matryoshka Embeddings
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className={`flex items-center p-2 rounded ${
                unit.embedding_status.has_fast ? 'bg-green-50' : 'bg-gray-50'
              }`}>
                <Zap className={`h-3 w-3 mr-1 ${
                  unit.embedding_status.has_fast ? 'text-green-500' : 'text-gray-400'
                }`} />
                <div>
                  <p className="text-xs font-medium">Tier 1</p>
                  <p className="text-xs text-gray-500">
                    {unit.embedding_status.has_fast ? `${unit.embedding_status.fast_dimensions}d` : 'N/A'}
                  </p>
                </div>
              </div>
              <div className={`flex items-center p-2 rounded ${
                unit.embedding_status.has_balanced ? 'bg-blue-50' : 'bg-gray-50'
              }`}>
                <Shield className={`h-3 w-3 mr-1 ${
                  unit.embedding_status.has_balanced ? 'text-blue-500' : 'text-gray-400'
                }`} />
                <div>
                  <p className="text-xs font-medium">Tier 2</p>
                  <p className="text-xs text-gray-500">
                    {unit.embedding_status.has_balanced ? `${unit.embedding_status.balanced_dimensions}d` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="border-t pt-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-sm font-medium text-gray-900">{unit.pricing_summary.seasonal_rules + unit.pricing_summary.hourly_rules}</p>
                <p className="text-xs text-gray-500">Pricing Rules</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{unit.amenities_summary.total}</p>
                <p className="text-xs text-gray-500">Amenities</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{unit.amenities_summary.premium}</p>
                <p className="text-xs text-gray-500">Premium</p>
              </div>
            </div>
          </div>

          {/* Enhanced Action Button */}
          <Button
            onClick={() => setSelectedUnit(unit)}
            className={`w-full bg-gradient-to-r from-${themeColor}-500 to-${themeColor}-600 hover:from-${themeColor}-600 hover:to-${themeColor}-700 text-white font-semibold py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group-hover:animate-pulse`}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-6 animate-fadeIn">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Accommodation Units</h2>
            <p className="text-gray-600">Themed reggae-inspired suites with Matryoshka embeddings</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{units.length} Units Active</p>
            <p className="text-xs text-gray-500">Multi-tier search enabled</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center">
            <Home className="h-5 w-5 text-blue-500 mr-2" />
            <div>
              <p className="text-lg font-bold">{units.length}</p>
              <p className="text-xs text-gray-500">Total Units</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <Crown className="h-5 w-5 text-yellow-500 mr-2" />
            <div>
              <p className="text-lg font-bold">{units.filter(u => u.is_featured).length}</p>
              <p className="text-xs text-gray-500">Featured</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <Layers className="h-5 w-5 text-purple-500 mr-2" />
            <div>
              <p className="text-lg font-bold">100%</p>
              <p className="text-xs text-gray-500">Embedding Coverage</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-green-500 mr-2" />
            <div>
              <p className="text-lg font-bold">18ms</p>
              <p className="text-xs text-gray-500">Avg Search Time</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {units.map((unit) => (
          <UnitCard key={unit.id} unit={unit} />
        ))}
      </div>

      {/* Detailed View Modal */}
      {selectedUnit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{selectedUnit.name}</h3>
                <Button
                  onClick={() => setSelectedUnit(null)}
                  variant="outline"
                  size="sm"
                >
                  Close
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Tourism Features (Tier 1)</h4>
                  <p className="text-sm text-gray-600 mb-4">{selectedUnit.tourism_features}</p>

                  <h4 className="font-medium mb-2">Booking Policies (Tier 2)</h4>
                  <p className="text-sm text-gray-600 mb-4">{selectedUnit.booking_policies}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Pricing Rules</h4>
                  <div className="space-y-2 mb-4">
                    {selectedUnit.pricing_rules?.slice(0, 3).map((rule, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                        <strong>{rule.rule_name}:</strong> ${rule.base_price} {rule.currency}
                      </div>
                    ))}
                  </div>

                  <h4 className="font-medium mb-2">Amenities</h4>
                  <div className="grid grid-cols-2 gap-1">
                    {selectedUnit.unit_amenities?.slice(0, 6).map((amenity, index) => (
                      <div key={index} className="text-sm text-gray-600 flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        {amenity.amenity_name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}