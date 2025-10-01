import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantSchemaName } from '@/lib/tenant-resolver'

/**
 * POST /api/tenant/resolve
 *
 * Resolves tenant slug or UUID to tenant_id UUID
 * Used by guest-chat page to support friendly URLs
 */
export async function POST(request: NextRequest) {
  try {
    const { slugOrUuid } = await request.json()

    if (!slugOrUuid) {
      return NextResponse.json(
        { error: 'slugOrUuid is required' },
        { status: 400 }
      )
    }

    const tenantId = await resolveTenantSchemaName(slugOrUuid)

    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
    })
  } catch (error) {
    console.error('[tenant-resolve] Error:', error)

    return NextResponse.json(
      {
        error: 'Tenant not found',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 404 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/tenant/resolve',
    description: 'Resolves tenant slug or UUID to tenant_id',
    method: 'POST',
    request: {
      body: {
        slugOrUuid: 'string (slug like "simmerdown" or UUID)',
      },
    },
    response: {
      success: 'boolean',
      tenant_id: 'string (UUID)',
    },
  })
}
