/**
 * Find which MotoPress accommodation_type IDs are not in hotels.accommodation_units
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function findUnmapped() {
  const tenantId = 'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf'

  // Get MotoPress config
  const { data: config } = await supabase
    .from('integration_configs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('integration_type', 'motopress')
    .single()

  if (!config) {
    console.error('No config found')
    return
  }

  const credentials = config.config_data
  const auth = Buffer.from(`${credentials.consumer_key}:${credentials.consumer_secret}`).toString('base64')
  const baseUrl = `${credentials.site_url.replace(/\/$/, '')}/wp-json/mphb/v1`

  // Fetch future bookings
  const today = new Date().toISOString().split('T')[0]
  const response = await fetch(`${baseUrl}/bookings?status=confirmed&per_page=100`, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  })

  const allBookings = await response.json()
  const futureBookings = allBookings.filter((b: any) => b.check_in_date >= today)

  // Collect all unique accommodation_type IDs
  const typeIds = new Set<number>()
  futureBookings.forEach((booking: any) => {
    booking.reserved_accommodations?.forEach((unit: any) => {
      if (unit.accommodation_type) {
        typeIds.add(unit.accommodation_type)
      }
    })
  })

  console.log('🔍 MotoPress accommodation_type IDs in future bookings:')
  console.log(Array.from(typeIds).sort((a, b) => a - b))

  // Get available types in hotels.accommodation_units
  const { data: unitsData } = await supabase.rpc('exec_sql', {
    sql: `SELECT motopress_unit_id FROM hotels.accommodation_units WHERE tenant_id = '${tenantId}' ORDER BY motopress_unit_id`
  }) as any

  console.log('\n📦 Available in hotels.accommodation_units:')

  // Since exec_sql doesn't return SELECT data, query via MCP
  const { data: units } = await supabase
    .from('tenant_registry')
    .select('tenant_id')
    .eq('slug', 'simmerdown')
    .single()

  console.log('\n⚠️  Missing mappings (accommodation_type IDs not in hotels.accommodation_units):')

  // For each type ID, try the RPC
  for (const typeId of Array.from(typeIds).sort((a, b) => a - b)) {
    const { data: unitId } = await supabase.rpc('get_accommodation_unit_by_motopress_id', {
      p_tenant_id: tenantId,
      p_motopress_unit_id: typeId
    })

    if (!unitId) {
      console.log(`   - accommodation_type: ${typeId} ❌ NOT FOUND`)

      // Find bookings using this type
      const bookingsWithType = futureBookings.filter((b: any) =>
        b.reserved_accommodations?.some((u: any) => u.accommodation_type === typeId)
      )

      if (bookingsWithType.length > 0) {
        console.log(`     Used in ${bookingsWithType.length} booking(s):`)
        bookingsWithType.slice(0, 3).forEach((b: any) => {
          console.log(`       - MP-${b.id}: ${b.customer.first_name} ${b.customer.last_name} (${b.check_in_date})`)
        })
      }
    } else {
      console.log(`   - accommodation_type: ${typeId} ✅ mapped`)
    }
  }
}

findUnmapped()
