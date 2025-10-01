// Simple test to debug staff login
async function testLogin() {
  try {
    const response = await fetch('http://localhost:3000/api/staff/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin_ceo',
        password: 'innpilot2025',
        tenant_id: 'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf'
      })
    })

    console.log('Status:', response.status)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))

    const text = await response.text()
    console.log('Raw response:', text)

    try {
      const json = JSON.parse(text)
      console.log('Parsed JSON:', JSON.stringify(json, null, 2))
    } catch (e) {
      console.log('Could not parse as JSON')
    }
  } catch (error) {
    console.error('Fetch error:', error.message)
  }
}

testLogin()
