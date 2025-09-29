interface MotoPresAccommodation {
  id: number
  title: {
    rendered: string
  }
  content: {
    rendered: string
  }
  meta: {
    mphb_room_type_id?: number
    mphb_adults?: number
    mphb_children?: number
    mphb_bed_type?: string
    mphb_room_size?: string
    mphb_amenities?: string[]
    mphb_gallery?: string[]
    mphb_price?: number
    mphb_view?: string
    mphb_location?: string
  }
  featured_media: number
  status: string
  date: string
  modified: string
}

interface MotoPresApiResponse<T> {
  data?: T
  error?: string
  status: number
}

interface ConnectionInfo {
  apiKey: string
  consumerSecret?: string
  siteUrl: string
}

export class MotoPresClient {
  private apiKey: string
  private consumerSecret: string
  private baseUrl: string
  private timeout: number = 30000

  constructor({ apiKey, consumerSecret, siteUrl }: ConnectionInfo) {
    this.apiKey = apiKey
    this.consumerSecret = consumerSecret || 'cs_8fc58d0a3af6663b3dca2776f54f18d55f2aaea4' // Fallback to known working secret
    this.baseUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/mphb/v1`
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<MotoPresApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      // Use Basic Auth with Consumer Key and Secret (like test-connection endpoint)
      const credentials = Buffer.from(`${this.apiKey}:${this.consumerSecret}`).toString('base64')

      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
          'User-Agent': 'InnPilot/1.0',
          ...options.headers
        },
        signal: AbortSignal.timeout(this.timeout)
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          error: `HTTP ${response.status}: ${errorText}`,
          status: response.status
        }
      }

      const data = await response.json()
      return {
        data,
        status: response.status
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          error: 'Request timeout',
          status: 408
        }
      }

      return {
        error: error.message || 'Network error',
        status: 0
      }
    }
  }

  async testConnection(): Promise<{
    success: boolean
    message: string
    accommodationsCount?: number
  }> {
    const response = await this.makeRequest<MotoPresAccommodation[]>('/accommodation_types?per_page=1')

    if (response.error) {
      return {
        success: false,
        message: response.error
      }
    }

    return {
      success: true,
      message: 'Connection successful',
      accommodationsCount: response.data?.length || 0
    }
  }

  async getAccommodations(
    page: number = 1,
    perPage: number = 100
  ): Promise<MotoPresApiResponse<MotoPresAccommodation[]>> {
    return this.makeRequest<MotoPresAccommodation[]>(
      `/accommodation_types?page=${page}&per_page=${perPage}&status=publish`
    )
  }

  async getAccommodation(id: number): Promise<MotoPresApiResponse<MotoPresAccommodation>> {
    return this.makeRequest<MotoPresAccommodation>(`/accommodation_types/${id}`)
  }

  async getAllAccommodations(): Promise<MotoPresApiResponse<MotoPresAccommodation[]>> {
    const allAccommodations: MotoPresAccommodation[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const response = await this.getAccommodations(page, 100)

      if (response.error) {
        return response
      }

      const accommodations = response.data || []
      allAccommodations.push(...accommodations)

      // Si recibimos menos de 100, hemos llegado al final
      hasMore = accommodations.length === 100
      page++

      // Pausa entre requests para no sobrecargar la API
      await new Promise(resolve => setTimeout(resolve, 250))
    }

    return {
      data: allAccommodations,
      status: 200
    }
  }

  async getRoomTypes(): Promise<MotoPresApiResponse<any[]>> {
    return this.makeRequest<any[]>('/room-types')
  }

  async getBookings(
    dateFrom?: string,
    dateTo?: string
  ): Promise<MotoPresApiResponse<any[]>> {
    const params = new URLSearchParams()
    if (dateFrom) params.append('date_from', dateFrom)
    if (dateTo) params.append('date_to', dateTo)

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.makeRequest<any[]>(`/bookings${query}`)
  }
}