/**
 * Test script for Reservations API Endpoint
 * Tests /api/reservations/list with staff authentication
 */

const API_BASE_URL = 'http://localhost:3000'

// Staff credentials for Simmerdown
const STAFF_CREDENTIALS = {
  username: 'admin_simmer',
  password: 'Staff2024!',  // From SNAPSHOT.md
  tenant_id: 'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf',
}

async function testReservationsAPI() {
  console.log('🧪 Testing Reservations API Endpoint')
  console.log('═'.repeat(60))

  try {
    // Step 1: Staff Login
    console.log('\n📝 Step 1: Staff Login')
    console.log('   Endpoint: POST /api/staff/login')
    console.log('   Credentials:', {
      username: STAFF_CREDENTIALS.username,
      tenant_id: STAFF_CREDENTIALS.tenant_id,
    })

    const loginResponse = await fetch(`${API_BASE_URL}/api/staff/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(STAFF_CREDENTIALS),
    })

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json()
      throw new Error(`Login failed: ${errorData.error || errorData.message}`)
    }

    const loginData = await loginResponse.json()
    console.log('   ✅ Login successful')
    console.log('   Staff:', loginData.data.staff_info.full_name)
    console.log('   Role:', loginData.data.staff_info.role)

    const token = loginData.data.token

    // Step 2: Fetch Future Reservations
    console.log('\n📋 Step 2: Fetch Future Reservations')
    console.log('   Endpoint: GET /api/reservations/list?future=true&status=active')

    const reservationsResponse = await fetch(
      `${API_BASE_URL}/api/reservations/list?future=true&status=active`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )

    if (!reservationsResponse.ok) {
      const errorData = await reservationsResponse.json()
      throw new Error(`Reservations fetch failed: ${errorData.error}`)
    }

    const reservationsData = await reservationsResponse.json()
    console.log('   ✅ Reservations fetched successfully')
    console.log('   Hotel:', reservationsData.data.tenant_info.hotel_name)
    console.log('   Total future reservations:', reservationsData.data.total)

    // Step 3: Display Reservations
    if (reservationsData.data.total > 0) {
      console.log('\n📊 Reservations List:')
      console.log('─'.repeat(60))

      reservationsData.data.reservations.forEach((res: any, index: number) => {
        const checkIn = new Date(res.check_in_date)
        const checkOut = new Date(res.check_out_date)
        const today = new Date()
        const daysUntil = Math.ceil((checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        console.log(`\n${index + 1}. ${res.guest_name}`)
        console.log(`   Code: ${res.reservation_code || 'N/A'}`)
        console.log(`   Check-in: ${res.check_in_date} (in ${daysUntil} days)`)
        console.log(`   Check-out: ${res.check_out_date}`)
        console.log(`   Phone: ${res.phone_full || `***-${res.phone_last_4}`}`)
        console.log(`   Status: ${res.status}`)
        if (res.accommodation_unit) {
          console.log(`   Unit: ${res.accommodation_unit.name}`)
        }
      })
    } else {
      console.log('\n   ℹ️  No future reservations found')
    }

    // Step 4: Test with different filters
    console.log('\n🔍 Step 4: Test with different filters')

    // Test: All reservations (including past)
    console.log('\n   Testing: future=false (all reservations)')
    const allReservationsResponse = await fetch(
      `${API_BASE_URL}/api/reservations/list?future=false&status=active`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )

    if (allReservationsResponse.ok) {
      const allData = await allReservationsResponse.json()
      console.log(`   ✅ Found ${allData.data.total} total active reservations`)
    }

    // Final Summary
    console.log('\n' + '═'.repeat(60))
    console.log('✅ All tests passed successfully!')
    console.log('═'.repeat(60))

    // Return results for programmatic use
    return {
      success: true,
      total_future: reservationsData.data.total,
      hotel_name: reservationsData.data.tenant_info.hotel_name,
      reservations: reservationsData.data.reservations,
    }
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message)
    console.error('═'.repeat(60))
    return {
      success: false,
      error: error.message,
    }
  }
}

// Run the test
testReservationsAPI()
  .then((result) => {
    if (!result.success) {
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
