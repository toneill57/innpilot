'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { motion } from 'framer-motion'
import { MapPin, Navigation, ExternalLink } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface Location {
  id: string
  name: string
  lat: number
  lng: number
  type?: 'hotel' | 'restaurant' | 'attraction' | 'activity'
  description?: string
  address?: string
}

interface LocationMapProps {
  locations: Location[]
  center?: [number, number]
  zoom?: number
  height?: string
}

/**
 * LocationMap Component - FASE 2.4
 *
 * Interactive map showing locations
 * Features:
 * - Embedded map with Leaflet/React-Leaflet
 * - Custom markers for different entity types
 * - Directions integration
 * - Popup with location details
 * - Responsive container
 */
export function LocationMap({
  locations,
  center = [12.5840, -81.7006], // San Andrés default
  zoom = 13,
  height = '400px',
}: LocationMapProps) {
  const [isClient, setIsClient] = useState(false)

  // Only render map on client side (Leaflet doesn't support SSR)
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div
        className="w-full bg-gray-100 rounded-xl flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-gray-500">Cargando mapa...</p>
        </div>
      </div>
    )
  }

  // Calculate center if not provided
  const mapCenter: [number, number] =
    locations.length > 0
      ? [
          locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length,
          locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length,
        ]
      : center

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full rounded-xl overflow-hidden shadow-lg border border-gray-200"
      style={{ height }}
    >
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {locations.map((location) => (
          <LocationMarker key={location.id} location={location} />
        ))}

        <MapRecenter center={mapCenter} />
      </MapContainer>
    </motion.div>
  )
}

// Component to recenter map when locations change
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true })
  }, [center, map])

  return null
}

// Custom marker with popup
function LocationMarker({ location }: { location: Location }) {
  const getMarkerColor = (type?: string) => {
    switch (type) {
      case 'hotel':
        return '#3B82F6' // blue
      case 'restaurant':
        return '#EF4444' // red
      case 'attraction':
        return '#10B981' // green
      case 'activity':
        return '#F59E0B' // amber
      default:
        return '#6B7280' // gray
    }
  }

  const customIcon = L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${getMarkerColor(location.type)};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })

  const openDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`
    window.open(url, '_blank')
  }

  return (
    <Marker position={[location.lat, location.lng]} icon={customIcon}>
      <Popup>
        <div className="p-2 min-w-[200px]">
          <h3 className="font-semibold text-gray-900 mb-1">{location.name}</h3>

          {location.description && (
            <p className="text-sm text-gray-600 mb-2">{location.description}</p>
          )}

          {location.address && (
            <p className="text-xs text-gray-500 mb-3 flex items-start gap-1">
              <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{location.address}</span>
            </p>
          )}

          <button
            onClick={openDirections}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Navigation className="h-4 w-4" />
            Cómo llegar
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </Popup>
    </Marker>
  )
}

// Utility function to parse locations from text (for AI responses)
export function parseLocationsFromText(text: string): Location[] {
  // This would be implemented with NLP or regex to extract locations
  // For now, return empty array (to be enhanced)
  return []
}
