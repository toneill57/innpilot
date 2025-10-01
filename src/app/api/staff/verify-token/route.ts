/**
 * Staff Token Verification API Endpoint
 *
 * GET /api/staff/verify-token
 * Verifies if the staff JWT token is valid.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffToken } from '@/lib/staff-auth';

export async function GET(request: NextRequest) {
  try {
    // Extract Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          error: 'Missing authentication',
          message: 'Authorization header with Bearer token is required',
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const session = await verifyStaffToken(token);
    if (!session) {
      return NextResponse.json(
        {
          error: 'Invalid or expired token',
          message: 'Please login again',
        },
        { status: 401 }
      );
    }

    // Return success with basic session info
    return NextResponse.json(
      {
        valid: true,
        staff_info: {
          staff_id: session.staff_id,
          username: session.username,
          full_name: session.full_name,
          role: session.role,
          tenant_id: session.tenant_id,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[staff-verify-token-api] Verification error:', error);

    return NextResponse.json(
      {
        error: 'Token verification failed',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed', message: 'Use GET to verify token' },
    { status: 405 }
  );
}
