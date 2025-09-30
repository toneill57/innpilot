// Script to test Premium Chat DEV improvements
// Tests dual system: Accommodation + Tourism (MUVA)
// SIRE has its own separate chat system

const testQueries = [
  {
    name: '🌴 MUVA - Tourism (agua de coco)',
    query: 'agua de coco',
    expected: 'tourism results only, NO accommodation'
  },
  {
    name: '🏨 Accommodation (habitación para 2)',
    query: 'habitación privada para 2 personas',
    expected: 'accommodation results only'
  },
  {
    name: '🔀 Mixed (hotel con buceo)',
    query: 'hotel cerca de actividades de buceo',
    expected: 'both accommodation + tourism'
  },
  {
    name: '🍽️ Tourism - Restaurants (mariscos)',
    query: 'restaurantes de mariscos',
    expected: 'tourism/restaurant results'
  }
]

async function testPremiumChatDev() {
  console.log('='.repeat(60))
  console.log('PREMIUM CHAT DEV - DUAL SYSTEM TESTS (Accommodation + Tourism)')
  console.log('='.repeat(60))
  console.log()

  for (const test of testQueries) {
    console.log(`\n${test.name}`)
    console.log(`Query: "${test.query}"`)
    console.log(`Expected: ${test.expected}`)
    console.log('-'.repeat(60))

    const startTime = Date.now()

    try {
      const response = await fetch('http://localhost:3000/api/premium-chat-dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: test.query,
          client_id: 'test-client',
          business_name: 'Simmer Down'
        })
      })

      const data = await response.json()
      const endTime = Date.now()

      if (data.success) {
        console.log(`✅ SUCCESS (${endTime - startTime}ms)`)
        console.log(`Intent: ${data.metrics?.intent?.type} (${(data.metrics?.intent?.confidence * 100).toFixed(0)}%)`)
        console.log(`Sources: ${data.sources?.length || 0} results`)

        if (data.dev_info?.avoidEntities && data.dev_info.avoidEntities.length > 0) {
          console.log(`Avoid: ${data.dev_info.avoidEntities.join(', ')}`)
        }

        // Show first 200 chars of response
        const preview = data.response.substring(0, 200).replace(/\n/g, ' ')
        console.log(`Response: ${preview}...`)

      } else {
        console.log(`❌ ERROR: ${data.error}`)
      }
    } catch (error) {
      console.log(`❌ REQUEST FAILED: ${error.message}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('TESTS COMPLETE')
  console.log('='.repeat(60))
}

testPremiumChatDev().catch(console.error)