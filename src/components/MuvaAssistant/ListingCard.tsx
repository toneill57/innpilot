import { Badge } from '@/components/ui/badge'
import { Star, MapPin, DollarSign, Clock, Phone, Globe } from 'lucide-react'

interface ListingCardProps {
  title: string
  description: string
  category: string
  location?: string
  rating?: number
  price_range?: string
  tags?: string[]
  image_url?: string
  opening_hours?: string
  contact_info?: {
    phone?: string
    website?: string
    address?: string
  }
  searchQuery?: string // For highlighting search terms
}

export function ListingCard({ listing }: { listing: ListingCardProps }) {
  // Function to highlight search terms in text
  const highlightText = (text: string, query?: string) => {
    if (!query || !text) return text

    // Split query into individual terms and filter out empty strings
    const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2)
    if (terms.length === 0) return text

    // Create regex pattern for all terms
    const pattern = new RegExp(`(${terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')

    // Split text and wrap matches
    const parts = text.split(pattern)
    return parts.map((part, index) => {
      const isMatch = terms.some(term => part.toLowerCase().includes(term.toLowerCase()))
      return isMatch ? (
        <span key={index} className="search-highlight bg-yellow-200 text-yellow-900 px-1 rounded-sm font-medium">
          {part}
        </span>
      ) : (
        <span key={index}>{part}</span>
      )
    })
  }
  const categoryIcons: Record<string, string> = {
    'restaurant': '🍽️',
    'attraction': '🏖️',
    'activity': '🎯',
    'nightlife': '🌙',
    'hotel': '🏨',
    'transport': '🚗',
    'shopping': '🛍️',
    'beach': '🏖️',
    'culture': '🏛️',
    'nature': '🌿',
    'adventure': '⛰️',
    'guide': '📖'
  }

  const categoryColors: Record<string, string> = {
    'restaurant': 'bg-orange-100 text-orange-700 border-orange-200',
    'attraction': 'bg-blue-100 text-blue-700 border-blue-200',
    'activity': 'bg-purple-100 text-purple-700 border-purple-200',
    'nightlife': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'hotel': 'bg-green-100 text-green-700 border-green-200',
    'transport': 'bg-gray-100 text-gray-700 border-gray-200',
    'shopping': 'bg-pink-100 text-pink-700 border-pink-200',
    'beach': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'culture': 'bg-amber-100 text-amber-700 border-amber-200',
    'nature': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'adventure': 'bg-red-100 text-red-700 border-red-200',
    'guide': 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const priceRangeColors: Record<string, string> = {
    '$': 'text-green-600',
    '$$': 'text-yellow-600',
    '$$$': 'text-orange-600',
    '$$$$': 'text-red-600'
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4 mb-3 bg-white listing-card-enhanced">
      <div className="flex items-start gap-3">
        {/* Image */}
        {listing.image_url && (
          <div className="flex-shrink-0">
            <img
              src={listing.image_url}
              alt={listing.title}
              className="w-20 h-20 rounded-lg object-cover shadow-sm"
              onError={(e) => {
                // Hide image if it fails to load
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-2xl flex-shrink-0">
                {categoryIcons[listing.category] || '📍'}
              </span>
              <h3 className="font-semibold text-lg text-gray-900 truncate">
                {highlightText(listing.title, listing.searchQuery)}
              </h3>
            </div>

            {listing.rating && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-gray-700">
                  {listing.rating}
                </span>
              </div>
            )}
          </div>

          {/* Category Badge */}
          <div className="mb-2">
            <Badge
              variant="outline"
              className={`text-xs ${categoryColors[listing.category] || 'bg-gray-100 text-gray-700'}`}
            >
              {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
            </Badge>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {highlightText(listing.description, listing.searchQuery)}
          </p>

          {/* Details */}
          <div className="space-y-2">
            {/* Location and Price */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {listing.location && (
                <span className="flex items-center gap-1 text-gray-600">
                  <MapPin className="w-3 h-3" />
                  {highlightText(listing.location, listing.searchQuery)}
                </span>
              )}
              {listing.price_range && (
                <span className={`flex items-center gap-1 font-medium ${priceRangeColors[listing.price_range] || 'text-gray-600'}`}>
                  <DollarSign className="w-3 h-3" />
                  {listing.price_range}
                </span>
              )}
            </div>

            {/* Hours and Contact */}
            {(listing.opening_hours || listing.contact_info) && (
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                {listing.opening_hours && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {listing.opening_hours}
                  </span>
                )}
                {listing.contact_info?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {listing.contact_info.phone}
                  </span>
                )}
                {listing.contact_info?.website && (
                  <a
                    href={listing.contact_info.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Globe className="w-3 h-3" />
                    Sitio web
                  </a>
                )}
              </div>
            )}

            {/* Tags with highlighting */}
            {listing.tags && listing.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {listing.tags.slice(0, 4).map((tag, index) => {
                  const hasMatch = listing.searchQuery &&
                    listing.searchQuery.toLowerCase().split(/\s+/).some(term =>
                      term.length > 2 && tag.toLowerCase().includes(term.toLowerCase())
                    )
                  return (
                    <Badge
                      key={index}
                      variant="secondary"
                      className={`text-xs hover:bg-gray-200 transition-colors ${
                        hasMatch
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-300 font-medium'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {highlightText(tag, listing.searchQuery)}
                    </Badge>
                  )
                })}
                {listing.tags.length > 4 && (
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                    +{listing.tags.length - 4} más
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Address (if available) */}
          {listing.contact_info?.address && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                📍 {highlightText(listing.contact_info.address, listing.searchQuery)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ListingCard