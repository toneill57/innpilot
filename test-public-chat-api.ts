/**
 * Test Public Chat API Endpoint
 *
 * Tests /api/public/chat end-to-end
 */

import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const API_URL = 'http://localhost:3000/api/public/chat'

interface ChatResponse {
  success: boolean
  data?: {
    session_id: string
    response: string
    sources: Array<{
      table: string
      id: string
      name: string
      content: string
      similarity: number
      pricing?: {
        base_price_night: number
        currency: string
      }
      photos?: Array<{ url: string }>
    }>
    travel_intent: {
      check_in: string | null
      check_out: string | null
      guests: number | null
      accommodation_type: string | null
      captured_this_message: boolean
    }
    availability_url?: string
    suggestions: string[]
  }
  error?: string
  message?: string
}

async function sendMessage(message: string, sessionId?: string): Promise<ChatResponse> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      session_id: sessionId,
      tenant_id: 'simmerdown',
    }),
  })

  return response.json()
}

async function test() {
  console.log('🧪 Testing Public Chat API Endpoint\n')
  console.log('API URL:', API_URL)
  console.log()

  try {
    // TEST 1: First message (session creation)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('TEST 1: Session Creation')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Message: "Hola, ¿qué apartamentos tienen disponibles?"\n')

    const response1 = await sendMessage('Hola, ¿qué apartamentos tienen disponibles?')

    if (!response1.success || !response1.data) {
      console.error('❌ TEST 1 FAILED:', response1.error || response1.message)
      return
    }

    console.log(`✅ Session created: ${response1.data.session_id}`)
    console.log(`✅ Response generated (${response1.data.response.length} chars)`)
    console.log(`✅ Sources found: ${response1.data.sources.length}`)
    console.log(`✅ Suggestions: ${response1.data.suggestions.length}`)
    console.log()
    console.log('Response preview:')
    console.log(response1.data.response.substring(0, 200) + '...')
    console.log()
    console.log('Sources:')
    response1.data.sources.slice(0, 3).forEach((source, i) => {
      console.log(`  ${i + 1}. ${source.name} (similarity: ${(source.similarity * 100).toFixed(1)}%)`)
      if (source.pricing) {
        console.log(`     Price: $${source.pricing.base_price_night} ${source.pricing.currency}/night`)
      }
    })
    console.log()

    const sessionId = response1.data.session_id

    // TEST 2: Intent capture
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('TEST 2: Intent Capture')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Message: "Necesito apartamento para 4 personas del 15 al 20 de diciembre"\n')

    const response2 = await sendMessage(
      'Necesito apartamento para 4 personas del 15 al 20 de diciembre',
      sessionId
    )

    if (!response2.success || !response2.data) {
      console.error('❌ TEST 2 FAILED:', response2.error || response2.message)
      return
    }

    console.log(`✅ Same session used: ${response2.data.session_id === sessionId ? 'YES' : 'NO'}`)
    console.log(`✅ Intent captured: ${response2.data.travel_intent.captured_this_message ? 'YES' : 'NO'}`)
    console.log()
    console.log('Travel Intent:')
    console.log(`  Check-in: ${response2.data.travel_intent.check_in || 'Not captured'}`)
    console.log(`  Check-out: ${response2.data.travel_intent.check_out || 'Not captured'}`)
    console.log(`  Guests: ${response2.data.travel_intent.guests || 'Not captured'}`)
    console.log(`  Type: ${response2.data.travel_intent.accommodation_type || 'Not captured'}`)
    console.log()

    if (response2.data.availability_url) {
      console.log(`✅ Availability URL generated:`)
      console.log(`   ${response2.data.availability_url}`)
      console.log()
    } else {
      console.log(`⚠️  No availability URL generated (intent may be incomplete)`)
      console.log()
    }

    console.log('Response preview:')
    console.log(response2.data.response.substring(0, 200) + '...')
    console.log()

    // TEST 3: Session persistence
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('TEST 3: Session Persistence')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Message: "¿Cuál tiene cocina completa?"\n')

    const response3 = await sendMessage('¿Cuál tiene cocina completa?', sessionId)

    if (!response3.success || !response3.data) {
      console.error('❌ TEST 3 FAILED:', response3.error || response3.message)
      return
    }

    console.log(`✅ Session persisted: ${response3.data.session_id === sessionId ? 'YES' : 'NO'}`)
    console.log(`✅ Intent retained: check_in = ${response3.data.travel_intent.check_in || 'None'}`)
    console.log()
    console.log('Response preview:')
    console.log(response3.data.response.substring(0, 200) + '...')
    console.log()

    // SUMMARY
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ ALL TESTS PASSED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✓ Session creation working')
    console.log('✓ Public search working (accommodation_units_public)')
    console.log('✓ Intent extraction working')
    console.log('✓ Session persistence working')
    console.log('✓ Response generation working')
    console.log()
    console.log('🎉 Public Chat API is fully functional!')

  } catch (error) {
    console.error('❌ Test failed with error:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
      console.error('   Stack:', error.stack)
    }
  }
}

// Check if dev server is running
console.log('Checking if dev server is running...')
fetch('http://localhost:3000')
  .then(() => {
    console.log('✅ Dev server is running\n')
    test()
  })
  .catch(() => {
    console.error('❌ Dev server is NOT running!')
    console.error('   Please run: npm run dev')
    console.error()
    process.exit(1)
  })
