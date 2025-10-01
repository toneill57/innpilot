/**
 * Manual Test Script for Staff Chat System
 *
 * Este script prueba:
 * 1. CEO Authentication & Full Access
 * 2. Admin Authentication & Limited Access
 * 3. Housekeeper Authentication & Very Limited Access
 *
 * Ejecutar: node test-staff-manual.js
 */

const BASE_URL = 'http://localhost:3000'

// Test credentials (seeded data)
const CREDENTIALS = {
  ceo: {
    username: 'admin_ceo',
    password: 'innpilot2025',
    tenant_id: 'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf'
  },
  admin: {
    username: 'admin_simmer',
    password: 'innpilot2025',
    tenant_id: 'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf'
  },
  housekeeper: {
    username: 'housekeeping_maria',
    password: 'innpilot2025',
    tenant_id: 'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf'
  }
}

// Helper function for colored console output
const log = {
  success: (msg) => console.log('\x1b[32m✓\x1b[0m', msg),
  error: (msg) => console.log('\x1b[31m✗\x1b[0m', msg),
  info: (msg) => console.log('\x1b[36mℹ\x1b[0m', msg),
  section: (msg) => console.log('\n\x1b[1m' + msg + '\x1b[0m\n' + '='.repeat(60))
}

// Test 1: CEO Authentication
async function testCEOAuthentication() {
  log.section('TEST 1: CEO Authentication & Full Access')

  try {
    // Step 1: Login as CEO
    log.info('Step 1: Authenticating as CEO...')
    const loginResponse = await fetch(`${BASE_URL}/api/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(CREDENTIALS.ceo)
    })

    const loginData = await loginResponse.json()

    if (!loginResponse.ok) {
      log.error(`Login failed: ${loginData.error?.message || 'Unknown error'}`)
      return false
    }

    log.success('CEO authenticated successfully')
    log.info(`  - Staff ID: ${loginData.data.staff_info.staff_id}`)
    log.info(`  - Username: ${loginData.data.staff_info.username}`)
    log.info(`  - Role: ${loginData.data.staff_info.role}`)
    log.info(`  - Permissions: ${JSON.stringify(loginData.data.staff_info.permissions)}`)

    const ceoToken = loginData.data.token

    // Step 2: Ask a SIRE question (CEO should have access)
    log.info('\nStep 2: Asking SIRE compliance question...')
    const chatResponse = await fetch(`${BASE_URL}/api/staff/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ceoToken}`
      },
      body: JSON.stringify({
        message: '¿Cuáles son los requisitos SIRE para huéspedes extranjeros?'
      })
    })

    const chatData = await chatResponse.json()

    if (!chatResponse.ok) {
      log.error(`Chat failed: ${chatData.error?.message || 'Unknown error'}`)
      return false
    }

    log.success('CEO received SIRE response')
    log.info(`  - Conversation ID: ${chatData.conversation_id}`)
    log.info(`  - Response length: ${chatData.response.length} chars`)
    log.info(`  - Sources found: ${chatData.sources.length}`)
    log.info(`  - Intent type: ${chatData.metadata.intent.type}`)
    log.info(`  - Response time: ${chatData.metadata.response_time_ms}ms`)

    // Step 3: Ask an operations question
    log.info('\nStep 3: Asking operations question...')
    const opsResponse = await fetch(`${BASE_URL}/api/staff/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ceoToken}`
      },
      body: JSON.stringify({
        message: '¿Cuál es el protocolo de limpieza para suites?',
        conversation_id: chatData.conversation_id
      })
    })

    const opsData = await opsResponse.json()

    if (!opsResponse.ok) {
      log.error(`Operations query failed: ${opsData.error?.message}`)
      return false
    }

    log.success('CEO received operations response')
    log.info(`  - Sources: ${opsData.sources.map(s => s.table).join(', ')}`)
    log.info(`  - Cost: $${opsData.metadata.cost_usd}`)

    // Step 4: Get conversation history
    log.info('\nStep 4: Retrieving conversation history...')
    const historyResponse = await fetch(
      `${BASE_URL}/api/staff/chat/history?conversation_id=${chatData.conversation_id}`,
      {
        headers: { 'Authorization': `Bearer ${ceoToken}` }
      }
    )

    const historyData = await historyResponse.json()

    if (!historyResponse.ok) {
      log.error(`History retrieval failed: ${historyData.error?.message}`)
      return false
    }

    log.success('CEO retrieved conversation history')
    log.info(`  - Messages in conversation: ${historyData.messages.length}`)

    return true

  } catch (error) {
    log.error(`Exception: ${error.message}`)
    return false
  }
}

// Test 2: Admin Authentication
async function testAdminAuthentication() {
  log.section('TEST 2: Admin Authentication & Limited Access')

  try {
    // Step 1: Login as Admin
    log.info('Step 1: Authenticating as Admin...')
    const loginResponse = await fetch(`${BASE_URL}/api/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(CREDENTIALS.admin)
    })

    const loginData = await loginResponse.json()

    if (!loginResponse.ok) {
      log.error(`Admin login failed: ${loginData.error?.message}`)
      return false
    }

    log.success('Admin authenticated successfully')
    log.info(`  - Role: ${loginData.data.staff_info.role}`)
    log.info(`  - Permissions: ${JSON.stringify(loginData.data.staff_info.permissions)}`)

    const adminToken = loginData.data.token

    // Step 2: Ask operations question (should work)
    log.info('\nStep 2: Asking operations question...')
    const chatResponse = await fetch(`${BASE_URL}/api/staff/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        message: '¿Cómo se hace el check-in de un huésped?'
      })
    })

    const chatData = await chatResponse.json()

    if (!chatResponse.ok) {
      log.error(`Admin chat failed: ${chatData.error?.message}`)
      return false
    }

    log.success('Admin received operations response')
    log.info(`  - Sources: ${chatData.sources.length} found`)

    // Verify admin has sire_access but NOT modify_operations
    const hasModifyOps = loginData.data.staff_info.permissions.modify_operations
    if (hasModifyOps) {
      log.error('SECURITY ISSUE: Admin should NOT have modify_operations permission!')
      return false
    } else {
      log.success('Admin permissions correctly limited (no modify_operations)')
    }

    return true

  } catch (error) {
    log.error(`Exception: ${error.message}`)
    return false
  }
}

// Test 3: Housekeeper Limited Permissions
async function testHousekeeperLimitedAccess() {
  log.section('TEST 3: Housekeeper Authentication & Very Limited Access')

  try {
    // Step 1: Login as Housekeeper
    log.info('Step 1: Authenticating as Housekeeper...')
    const loginResponse = await fetch(`${BASE_URL}/api/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(CREDENTIALS.housekeeper)
    })

    const loginData = await loginResponse.json()

    if (!loginResponse.ok) {
      log.error(`Housekeeper login failed: ${loginData.error?.message}`)
      return false
    }

    log.success('Housekeeper authenticated successfully')
    log.info(`  - Role: ${loginData.data.staff_info.role}`)
    log.info(`  - Permissions: ${JSON.stringify(loginData.data.staff_info.permissions)}`)

    const housekeeperToken = loginData.data.token

    // Step 2: Ask housekeeping question (should work)
    log.info('\nStep 2: Asking housekeeping question...')
    const chatResponse = await fetch(`${BASE_URL}/api/staff/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${housekeeperToken}`
      },
      body: JSON.stringify({
        message: '¿Cuál es el protocolo de limpieza de habitaciones?'
      })
    })

    const chatData = await chatResponse.json()

    if (!chatResponse.ok) {
      log.error(`Housekeeper chat failed: ${chatData.error?.message}`)
      return false
    }

    log.success('Housekeeper received housekeeping response')
    log.info(`  - Sources: ${chatData.sources.map(s => `${s.table} (${s.category || 'N/A'})`).join(', ')}`)

    // Verify housekeeper should have access to public/housekeeper operations only
    const sources = chatData.sources
    const hasAdminOnlySources = sources.some(s =>
      s.table === 'hotel_operations' &&
      (s.access_level === 'admin_only' || s.access_level === 'ceo_only')
    )

    if (hasAdminOnlySources) {
      log.error('SECURITY ISSUE: Housekeeper accessed admin-only content!')
      return false
    } else {
      log.success('Housekeeper permissions correctly enforced (no admin content)')
    }

    // Verify housekeeper should NOT have admin_panel permission
    const hasAdminPanel = loginData.data.staff_info.permissions.admin_panel
    if (hasAdminPanel) {
      log.error('SECURITY ISSUE: Housekeeper should NOT have admin_panel permission!')
      return false
    } else {
      log.success('Housekeeper permissions correctly limited (no admin_panel)')
    }

    return true

  } catch (error) {
    log.error(`Exception: ${error.message}`)
    return false
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n' + '='.repeat(60))
  console.log('  STAFF CHAT SYSTEM - MANUAL INTEGRATION TESTS')
  console.log('='.repeat(60))

  const results = {
    ceo: false,
    admin: false,
    housekeeper: false
  }

  // Run tests sequentially
  results.ceo = await testCEOAuthentication()
  await new Promise(resolve => setTimeout(resolve, 1000)) // Delay between tests

  results.admin = await testAdminAuthentication()
  await new Promise(resolve => setTimeout(resolve, 1000))

  results.housekeeper = await testHousekeeperLimitedAccess()

  // Final summary
  log.section('TEST SUMMARY')

  console.log(`CEO Test:          ${results.ceo ? '\x1b[32m✓ PASSED\x1b[0m' : '\x1b[31m✗ FAILED\x1b[0m'}`)
  console.log(`Admin Test:        ${results.admin ? '\x1b[32m✓ PASSED\x1b[0m' : '\x1b[31m✗ FAILED\x1b[0m'}`)
  console.log(`Housekeeper Test:  ${results.housekeeper ? '\x1b[32m✓ PASSED\x1b[0m' : '\x1b[31m✗ FAILED\x1b[0m'}`)

  const allPassed = results.ceo && results.admin && results.housekeeper

  console.log('\n' + '='.repeat(60))
  if (allPassed) {
    console.log('\x1b[32m\x1b[1m  ✓ ALL TESTS PASSED - STAFF CHAT SYSTEM READY!\x1b[0m')
  } else {
    console.log('\x1b[31m\x1b[1m  ✗ SOME TESTS FAILED - REVIEW ERRORS ABOVE\x1b[0m')
  }
  console.log('='.repeat(60) + '\n')

  process.exit(allPassed ? 0 : 1)
}

// Run tests
runAllTests().catch(error => {
  log.error(`Fatal error: ${error.message}`)
  process.exit(1)
})
