/**
 * Manual Test Script for Guest Authentication System
 *
 * Tests the /api/guest/login endpoint with real credentials
 */

const baseUrl = process.env.BASE_URL || 'http://localhost:3000'

async function testGuestLogin() {
  console.log('🧪 Testing Guest Authentication System\n')

  // Test 1: Valid credentials (Carlos Rodríguez - RSV002)
  console.log('Test 1: Valid credentials')
  try {
    const response = await fetch(`${baseUrl}/api/guest/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenant_id: 'ONEILL SAID SAS',
        check_in_date: '2024-12-02',
        phone_last_4: '1234',
      }),
    })

    const data = await response.json()
    console.log('Status:', response.status)
    console.log('Response:', JSON.stringify(data, null, 2))

    if (data.success) {
      console.log('✅ PASSED: Successfully authenticated')
      console.log('Token (first 20 chars):', data.token.substring(0, 20) + '...')
      console.log('Guest:', data.guest_info.name)
    } else {
      console.log('❌ FAILED:', data.error)
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message)
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // Test 2: Invalid credentials
  console.log('Test 2: Invalid credentials (wrong phone)')
  try {
    const response = await fetch(`${baseUrl}/api/guest/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenant_id: 'ONEILL SAID SAS',
        check_in_date: '2024-12-02',
        phone_last_4: '9999', // Wrong number
      }),
    })

    const data = await response.json()
    console.log('Status:', response.status)
    console.log('Response:', JSON.stringify(data, null, 2))

    if (!data.success && data.code === 'NO_RESERVATION') {
      console.log('✅ PASSED: Correctly rejected invalid credentials')
    } else {
      console.log('❌ FAILED: Should have rejected invalid credentials')
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message)
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // Test 3: Malformed phone_last_4
  console.log('Test 3: Malformed phone_last_4 (3 digits)')
  try {
    const response = await fetch(`${baseUrl}/api/guest/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenant_id: 'ONEILL SAID SAS',
        check_in_date: '2024-12-02',
        phone_last_4: '123', // Only 3 digits
      }),
    })

    const data = await response.json()
    console.log('Status:', response.status)
    console.log('Response:', JSON.stringify(data, null, 2))

    if (!data.success && data.code === 'INVALID_PHONE_FORMAT') {
      console.log('✅ PASSED: Correctly rejected malformed phone')
    } else {
      console.log('❌ FAILED: Should have rejected malformed phone')
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message)
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // Test 4: Missing fields
  console.log('Test 4: Missing required fields')
  try {
    const response = await fetch(`${baseUrl}/api/guest/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenant_id: 'ONEILL SAID SAS',
        // Missing check_in_date and phone_last_4
      }),
    })

    const data = await response.json()
    console.log('Status:', response.status)
    console.log('Response:', JSON.stringify(data, null, 2))

    if (!data.success && data.code === 'MISSING_FIELDS') {
      console.log('✅ PASSED: Correctly rejected missing fields')
    } else {
      console.log('❌ FAILED: Should have rejected missing fields')
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message)
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // Test 5: Ana Torres (RSV003)
  console.log('Test 5: Second valid guest (Ana Torres)')
  try {
    const response = await fetch(`${baseUrl}/api/guest/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenant_id: 'ONEILL SAID SAS',
        check_in_date: '2024-12-03',
        phone_last_4: '6789',
      }),
    })

    const data = await response.json()
    console.log('Status:', response.status)
    console.log('Response:', JSON.stringify(data, null, 2))

    if (data.success) {
      console.log('✅ PASSED: Successfully authenticated second guest')
      console.log('Guest:', data.guest_info.name)
    } else {
      console.log('❌ FAILED:', data.error)
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message)
  }

  console.log('\n🏁 Test suite completed\n')
}

// Run tests
testGuestLogin().catch(console.error)
