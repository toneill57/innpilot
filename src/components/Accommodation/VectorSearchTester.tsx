'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Zap,
  Shield,
  Clock,
  Target,
  Layers,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Home,
  Hotel
} from "lucide-react"

interface SearchResult {
  success: boolean
  query: string
  search_type: 'tourism' | 'policies'
  tier_info: {
    name: string
    dimensions: number
    search_duration_ms: number
  }
  results: {
    accommodation_units: Array<{
      id: string
      name: string
      view_type?: string
      tourism_features?: string
      booking_policies?: string
      similarity: number
    }>
    hotels: Array<{
      id: string
      name: string
      tourism_summary?: string
      policies_summary?: string
      search_tier: string
      similarity: number
    }>
    total_units: number
    total_hotels: number
  }
  performance: {
    embedding_generation_ms: number
    vector_search_ms: number
    total_ms: number
  }
}

export function VectorSearchTester() {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<'tourism' | 'policies'>('tourism')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([])

  const exampleQueries = {
    tourism: [
      'habitación reggae con vista al mar y terraza para relajarse',
      'suite temática con decoración rastafari y hamaca',
      'acomodación con vista al jardín tropical y música',
      'hotel reggae San Andrés con terraza y jardín tropical'
    ],
    policies: [
      'políticas de check-in y capacidad para 2 personas',
      'reglas de cancelación y fumadores',
      'políticas de huéspedes menores de edad',
      'horarios de check-out y servicios incluidos'
    ]
  }

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setError(null)

    try {
      const response = await fetch('/api/accommodation/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          search_type: searchType,
          similarity_threshold: 0.1,
          match_count: 5
        })
      })

      const data = await response.json()

      if (data.success) {
        setResults(data)
        setSearchHistory(prev => [data, ...prev.slice(0, 4)]) // Keep last 5 searches
      } else {
        setError(data.error || 'Search failed')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setIsSearching(false)
    }
  }

  const handleExampleQuery = (exampleQuery: string) => {
    setQuery(exampleQuery)
  }

  const getPerformanceColor = (ms: number) => {
    if (ms < 20) return 'text-green-600'
    if (ms < 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceIcon = (ms: number) => {
    if (ms < 20) return CheckCircle
    if (ms < 50) return AlertCircle
    return AlertCircle
  }

  return (
    <div className="p-6 animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-700 bg-clip-text text-transparent mb-2">Vector Search Tester</h2>
        <p className="text-gray-600 font-medium">Test Matryoshka multi-tier vector search in real-time ⚡</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Interface */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enhanced Search Form */}
          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2 text-blue-600 animate-pulse" />
                <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent font-bold">Search Query</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Type Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSearchType('tourism')}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 group ${
                    searchType === 'tourism'
                      ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 text-green-900 shadow-lg scale-105'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:bg-green-50/50 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <Zap className={`h-6 w-6 transition-all duration-300 ${searchType === 'tourism' ? 'text-green-500 animate-bounce' : 'text-gray-400 group-hover:text-green-500 group-hover:scale-110'}`} />
                  </div>
                  <div className="text-sm font-bold mb-1">Tourism Search</div>
                  <div className="text-xs text-gray-500 font-medium">Tier 1 • 1024 dims • Ultra Fast ⚡</div>
                </button>
                <button
                  onClick={() => setSearchType('policies')}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 group ${
                    searchType === 'policies'
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900 shadow-lg scale-105'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <Shield className={`h-6 w-6 transition-all duration-300 ${searchType === 'policies' ? 'text-blue-500 animate-pulse' : 'text-gray-400 group-hover:text-blue-500 group-hover:scale-110'}`} />
                  </div>
                  <div className="text-sm font-bold mb-1">Policies Search</div>
                  <div className="text-xs text-gray-500 font-medium">Tier 2 • 1536 dims • Balanced 🛡️</div>
                </button>
              </div>

              {/* Enhanced Query Input */}
              <div className="flex space-x-3">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Enter your ${searchType} search query...`}
                  className="flex-1 h-12 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl shadow-sm transition-all duration-300"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !query.trim()}
                  className="px-8 h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  {isSearching ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>

              {/* Example Queries */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">💡 Example Queries:</h4>
                <div className="grid grid-cols-1 gap-2">
                  {exampleQueries[searchType].map((example, index) => (
                    <button
                      key={index}
                      onClick={() => handleExampleQuery(example)}
                      className="text-left p-3 text-sm text-gray-700 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg hover:from-blue-50 hover:to-purple-50 transition-all duration-300 border border-gray-200 hover:border-blue-300 hover:shadow-md transform hover:scale-[1.02] font-medium"
                    >
                      <span className="text-blue-600 font-bold">"</span>{example}<span className="text-blue-600 font-bold">"</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {results && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Search Results
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {results.results.total_units} units, {results.results.total_hotels} hotels
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Enhanced Performance Metrics */}
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-green-200 shadow-sm">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-white/70 rounded-lg">
                      <div className={`text-2xl font-bold ${getPerformanceColor(results.performance.total_ms)} mb-1`}>
                        {results.performance.total_ms}ms
                      </div>
                      <div className="text-gray-600 font-medium">⚡ Total Time</div>
                    </div>
                    <div className="text-center p-3 bg-white/70 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {results.tier_info.dimensions}d
                      </div>
                      <div className="text-gray-600 font-medium">📐 Dimensions</div>
                    </div>
                    <div className="text-center p-3 bg-white/70 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {results.tier_info.name}
                      </div>
                      <div className="text-gray-600 font-medium">🎯 Tier Used</div>
                    </div>
                  </div>
                </div>

                {/* Accommodation Units Results */}
                {results.results.accommodation_units.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Home className="h-4 w-4 mr-2" />
                      Accommodation Units ({results.results.total_units})
                    </h4>
                    <div className="space-y-3">
                      {results.results.accommodation_units.map((unit, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{unit.name}</h5>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">{unit.view_type}</span>
                              <span className="text-sm font-medium text-green-600">
                                {(unit.similarity * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            {searchType === 'tourism' ? unit.tourism_features : unit.booking_policies}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hotels Results */}
                {results.results.hotels.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Hotel className="h-4 w-4 mr-2" />
                      Hotels ({results.results.total_hotels})
                    </h4>
                    <div className="space-y-3">
                      {results.results.hotels.map((hotel, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{hotel.name}</h5>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">{hotel.search_tier}</span>
                              <span className="text-sm font-medium text-blue-600">
                                {(hotel.similarity * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            {searchType === 'tourism' ? hotel.tourism_summary : hotel.policies_summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.results.total_units === 0 && results.results.total_hotels === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No results found for this query</p>
                    <p className="text-sm">Try adjusting your search terms or search type</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <div className="flex items-center text-red-700">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Search History & Analytics */}
        <div className="space-y-6">
          {/* Performance Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Embedding Generation</span>
                      <span className="text-sm font-medium">
                        {results.performance.embedding_generation_ms}ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Vector Search</span>
                      <span className="text-sm font-medium">
                        {results.performance.vector_search_ms}ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="text-sm font-medium text-gray-900">Total Time</span>
                      <span className={`text-sm font-bold ${getPerformanceColor(results.performance.total_ms)}`}>
                        {results.performance.total_ms}ms
                      </span>
                    </div>
                  </div>

                  {/* Performance Indicator */}
                  <div className="mt-4">
                    <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                      {React.createElement(getPerformanceIcon(results.performance.total_ms), {
                        className: `h-6 w-6 ${getPerformanceColor(results.performance.total_ms)} mb-1`
                      })}
                      <div className="ml-2 text-center">
                        <div className="text-sm font-medium">
                          {results.performance.total_ms < 20 ? 'Excellent' :
                           results.performance.total_ms < 50 ? 'Good' : 'Needs Improvement'}
                        </div>
                        <div className="text-xs text-gray-500">Performance Rating</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {!results && (
                <div className="text-center py-4 text-gray-500">
                  <Clock className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm">Run a search to see performance metrics</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Recent Searches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {searchHistory.slice(0, 3).map((search, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium truncate">{search.query}</span>
                        <span className={`text-xs ${getPerformanceColor(search.performance.total_ms)}`}>
                          {search.performance.total_ms}ms
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{search.tier_info.name}</span>
                        <span>{search.results.total_units + search.results.total_hotels} results</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Matryoshka Tier Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Layers className="h-5 w-5 mr-2" />
                Matryoshka Tiers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-2 bg-green-50 rounded">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <Zap className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm font-medium">Tier 1</span>
                  </div>
                  <span className="text-xs text-green-600">1024d</span>
                </div>
                <p className="text-xs text-gray-600">Ultra-fast tourism searches (5-15ms)</p>
              </div>

              <div className="p-2 bg-blue-50 rounded">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-sm font-medium">Tier 2</span>
                  </div>
                  <span className="text-xs text-blue-600">1536d</span>
                </div>
                <p className="text-xs text-gray-600">Balanced policy searches (15-40ms)</p>
              </div>

              <div className="p-2 bg-purple-50 rounded">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <Layers className="h-4 w-4 text-purple-500 mr-2" />
                    <span className="text-sm font-medium">Tier 3</span>
                  </div>
                  <span className="text-xs text-purple-600">3072d</span>
                </div>
                <p className="text-xs text-gray-600">Full precision searches (fallback)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}