import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { verifyStaffToken } from '@/lib/staff-auth'

export async function POST(request: NextRequest) {
  try {
    const { tenant_id } = await request.json()

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'tenant_id is required' },
        { status: 400 }
      )
    }

    // Verify staff authentication using JWT
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const staffInfo = await verifyStaffToken(token)

    if (!staffInfo) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Verify staff belongs to the tenant
    if (staffInfo.tenant_id !== tenant_id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only delete accommodations for your own tenant' },
        { status: 403 }
      )
    }

    // Verify staff has permission (CEO or Admin only)
    if (!['ceo', 'admin'].includes(staffInfo.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Only CEO or Admin can delete all accommodations' },
        { status: 403 }
      )
    }

    const supabase = createServerClient()

    // Delete all accommodation units from public table
    const { data, error } = await supabase
      .from('accommodation_units_public')
      .delete()
      .eq('tenant_id', tenant_id)
      .select('unit_id')

    if (error) {
      console.error('[delete-all] Error deleting accommodations:', error)
      return NextResponse.json(
        { error: 'Failed to delete accommodations', details: error.message },
        { status: 500 }
      )
    }

    console.log(`[delete-all] ✅ Deleted ${data?.length || 0} accommodation(s) for tenant ${tenant_id}`)

    return NextResponse.json({
      success: true,
      deleted_count: data?.length || 0,
      message: `Successfully deleted ${data?.length || 0} accommodation(s)`
    })

  } catch (error: any) {
    console.error('[delete-all] Error in delete-all endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
