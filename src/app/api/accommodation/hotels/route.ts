import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')

    const supabase = createServerClient()
    let query = supabase
      .from('hotels')
      .select(`
        id,
        name,
        description,
        short_description,
        address,
        contact_info,
        hotel_amenities,
        tourism_summary,
        policies_summary,
        embedding_fast,
        embedding_balanced,
        full_description,
        policies,
        images,
        status,
        created_at,
        updated_at
      `)

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    const { data: hotels, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching hotels:', error)
      return NextResponse.json({ error: 'Failed to fetch hotels' }, { status: 500 })
    }

    // Add embedding status indicators
    const hotelsWithEmbeddingStatus = hotels?.map(hotel => ({
      ...hotel,
      embedding_status: {
        has_fast: !!hotel.embedding_fast,
        has_balanced: !!hotel.embedding_balanced,
        fast_dimensions: hotel.embedding_fast?.length || 0,
        balanced_dimensions: hotel.embedding_balanced?.length || 0
      }
    }))

    console.log('Returning hotels:', {
      count: hotels?.length || 0,
      firstHotel: hotels?.[0]?.name || 'none',
      success: true
    })

    return NextResponse.json({
      success: true,
      hotels: hotelsWithEmbeddingStatus,
      count: hotels?.length || 0
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}