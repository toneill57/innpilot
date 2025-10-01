/**
 * Test Database Setup Script
 *
 * Creates test reservation data for E2E tests
 * Run this before executing E2E tests: npm run test:e2e:setup
 */

import { createClient } from '@supabase/supabase-js'

// Test data configuration
const TEST_RESERVATION = {
  tenant_id: 'test-hotel',
  guest_name: 'Test Guest',
  check_in_date: '2025-10-05',
  check_out_date: '2025-10-08',
  phone_last_4: '1234',
  phone_full: '+57 300 1234567',
  reservation_code: 'TEST001',
  status: 'active',
}

async function setupTestData() {
  console.log('Setting up test data for E2E tests...\n')

  // Check for environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing Supabase credentials')
    console.error('Required environment variables:')
    console.error('  - NEXT_PUBLIC_SUPABASE_URL')
    console.error('  - SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 1. Check if test reservation already exists
    const { data: existing, error: checkError } = await supabase
      .from('guest_reservations')
      .select('*')
      .eq('tenant_id', TEST_RESERVATION.tenant_id)
      .eq('phone_last_4', TEST_RESERVATION.phone_last_4)
      .eq('check_in_date', TEST_RESERVATION.check_in_date)
      .single()

    if (existing && !checkError) {
      console.log('✅ Test reservation already exists')
      console.log(`   Guest: ${existing.guest_name}`)
      console.log(`   Check-in: ${existing.check_in_date}`)
      console.log(`   Phone: •••• ${existing.phone_last_4}`)
      console.log(`   Code: ${existing.reservation_code}\n`)
      return existing
    }

    // 2. Create new test reservation
    console.log('Creating test reservation...')
    const { data: newReservation, error: createError } = await supabase
      .from('guest_reservations')
      .insert([TEST_RESERVATION])
      .select()
      .single()

    if (createError) {
      throw createError
    }

    console.log('✅ Test reservation created successfully')
    console.log(`   Guest: ${newReservation.guest_name}`)
    console.log(`   Check-in: ${newReservation.check_in_date}`)
    console.log(`   Phone: •••• ${newReservation.phone_last_4}`)
    console.log(`   Code: ${newReservation.reservation_code}\n`)

    // 3. Create test conversation (using correct table name)
    console.log('Creating test conversation...')
    const { data: conversation, error: conversationError } = await supabase
      .from('chat_conversations')
      .insert([
        {
          reservation_id: newReservation.id,
          tenant_id: TEST_RESERVATION.tenant_id,
          user_id: newReservation.id,
          user_type: 'guest',
          guest_phone_last_4: TEST_RESERVATION.phone_last_4,
          check_in_date: TEST_RESERVATION.check_in_date,
        },
      ])
      .select()
      .single()

    if (conversationError) {
      console.log('⚠️  Could not create conversation:', conversationError.message)
    } else {
      console.log('✅ Test conversation created')
      console.log(`   Conversation ID: ${conversation.id}\n`)
    }

    console.log('🎉 Test data setup complete!\n')
    console.log('You can now run E2E tests with:')
    console.log('  npm run test:e2e\n')

    return newReservation
  } catch (error) {
    console.error('❌ Error setting up test data:', error)
    process.exit(1)
  }
}

// Run if called directly (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  setupTestData()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { setupTestData }
