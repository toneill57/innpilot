import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

interface FeedbackRequest {
  messageId: string
  rating?: number
  feedbackText?: string
  question?: string
  responsePreview?: string
  category?: string
  location?: string
  filtersUsed?: Record<string, any>
  responseTimeMs?: number
  userSession?: string
}

export async function POST(request: NextRequest) {
  try {
    const {
      messageId,
      rating,
      feedbackText,
      question,
      responsePreview,
      category,
      location,
      filtersUsed,
      responseTimeMs,
      userSession
    }: FeedbackRequest = await request.json()

    // Validate required fields
    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      )
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Generate session ID if not provided
    const sessionId = userSession || `session_${Date.now()}_${Math.random().toString(36).substring(2)}`

    console.log(`[MUVA Feedback] Saving feedback for message ${messageId}, rating: ${rating}`)

    // Insert feedback into database
    const { data, error } = await supabase
      .from('muva_feedback')
      .insert({
        message_id: messageId,
        rating,
        feedback_text: feedbackText,
        question,
        response_preview: responsePreview?.substring(0, 200), // Limit to 200 chars
        category,
        location,
        filters_used: filtersUsed || {},
        response_time_ms: responseTimeMs,
        user_session: sessionId,
        timestamp: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('[MUVA Feedback] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      )
    }

    console.log(`[MUVA Feedback] ✅ Feedback saved successfully`)

    return NextResponse.json({
      success: true,
      feedbackId: data[0]?.id,
      message: 'Gracias por tu feedback. Nos ayuda a mejorar MUVA.'
    })

  } catch (error) {
    console.error('[MUVA Feedback] Error processing feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get feedback statistics (for admin/analytics)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    const category = searchParams.get('category')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    let query = supabase
      .from('muva_feedback')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data: feedbacks, error } = await query

    if (error) {
      console.error('[MUVA Feedback] Error fetching feedback:', error)
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const totalFeedbacks = feedbacks.length
    const ratingsData = feedbacks.filter(f => f.rating !== null)
    const averageRating = ratingsData.length > 0
      ? ratingsData.reduce((sum, f) => sum + f.rating, 0) / ratingsData.length
      : 0

    const ratingDistribution = {
      1: ratingsData.filter(f => f.rating === 1).length,
      2: ratingsData.filter(f => f.rating === 2).length,
      3: ratingsData.filter(f => f.rating === 3).length,
      4: ratingsData.filter(f => f.rating === 4).length,
      5: ratingsData.filter(f => f.rating === 5).length,
    }

    const categoryStats = feedbacks.reduce((acc: Record<string, number>, f) => {
      if (f.category) {
        acc[f.category] = (acc[f.category] || 0) + 1
      }
      return acc
    }, {})

    return NextResponse.json({
      totalFeedbacks,
      averageRating: Math.round(averageRating * 100) / 100,
      ratingDistribution,
      categoryStats,
      recentFeedbacks: feedbacks.slice(0, 10).map(f => ({
        id: f.id,
        rating: f.rating,
        feedback_text: f.feedback_text,
        category: f.category,
        timestamp: f.timestamp
      }))
    })

  } catch (error) {
    console.error('[MUVA Feedback] Error fetching statistics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}