import { NextRequest, NextResponse } from 'next/server'
import { verifyGuestToken } from '@/lib/guest-auth'

/**
 * POST /api/guest/verify-token
 *
 * Verifies a guest JWT token server-side (where JWT_SECRET is available)
 *
 * Request body: { token: string }
 * Response: { session: GuestSession } or 401 error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Verify token server-side (has access to JWT_SECRET)
    const session = await verifyGuestToken(token)

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Return session data
    return NextResponse.json({ session }, { status: 200 })

  } catch (error) {
    console.error('[verify-token] Error:', error)
    return NextResponse.json(
      { error: 'Token verification failed' },
      { status: 401 }
    )
  }
}
