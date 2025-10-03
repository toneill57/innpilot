/**
 * Check which accommodation_type IDs are used by the 10 unmapped reservations
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const unmappedBookingIds = [28675, 32318, 28289, 30497, 28580, 28635, 30499, 32991, 32979, 32776]

async function checkUnmapped() {
  const tenantId = 'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf'

  const { data: config } = await supabase
    .from('integration_configs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('integration_type', 'motopress')
    .single()

  if (!config) return

  const credentials = config.config_data
  const auth = Buffer.from(`${credentials.consumer_key}:${credentials.consumer_secret}`).toString('base64')
  const baseUrl = `${credentials.site_url.replace(/\/$/, '')}/wp-json/mphb/v1`

  console.log('🔍 Checking unmapped bookings:\n')

  for (const bookingId of unmappedBookingIds) {
    const response = await fetch(`${baseUrl}/bookings/${bookingId}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    })

    const booking = await response.json()

    console.log(`MP-${bookingId} (${booking.customer?.first_name || 'Guest'}):`)
    booking.reserved_accommodations?.forEach((unit: any, idx: number) => {
      console.log(`   Unit ${idx + 1}: accommodation_type = ${unit.accommodation_type}`)
    })
  }

  console.log('\n📦 Available in hotels.accommodation_units:')
  const { data: units } = await supabase.rpc('exec_sql', {
    sql: `SELECT name, motopress_unit_id FROM hotels.accommodation_units WHERE tenant_id = '${tenantId}' ORDER BY motopress_unit_id`
  }) as any

  // Since exec_sql doesn't return data, query directly
  console.log('   [Execute query manually to see available units]')
}

checkUnmapped()
