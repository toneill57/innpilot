#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates that all required environment variables are set
 */

import { config } from 'dotenv'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

// Load environment variables from .env.local and .env
config({ path: '.env.local' })
config({ path: '.env' })

const REQUIRED_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'CLAUDE_MODEL',
  'CLAUDE_MAX_TOKENS'
]

const OPTIONAL_ENV_VARS = [
  'VERCEL_URL',
  'VERCEL_ENV',
  'NODE_ENV'
]

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n')

  let isValid = true
  const missing = []
  const warnings = []

  // Check required variables
  REQUIRED_ENV_VARS.forEach(varName => {
    const value = process.env[varName]
    if (!value) {
      missing.push(varName)
      isValid = false
      console.log(`❌ ${varName}: MISSING`)
    } else {
      // Validate specific formats
      if (varName === 'SUPABASE_URL' && !value.startsWith('https://')) {
        warnings.push(`${varName}: Should start with https://`)
        console.log(`⚠️  ${varName}: ${value.substring(0, 30)}... (Warning: should start with https://)`)
      } else if (varName === 'CLAUDE_MAX_TOKENS' && isNaN(parseInt(value))) {
        warnings.push(`${varName}: Should be a number`)
        console.log(`⚠️  ${varName}: ${value} (Warning: should be a number)`)
      } else {
        console.log(`✅ ${varName}: ${maskSensitive(varName, value)}`)
      }
    }
  })

  // Check optional variables
  console.log('\n📋 Optional environment variables:')
  OPTIONAL_ENV_VARS.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      console.log(`✅ ${varName}: ${value}`)
    } else {
      console.log(`⚪ ${varName}: Not set`)
    }
  })

  // Summary
  console.log('\n📊 Environment Summary:')
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`Required variables: ${REQUIRED_ENV_VARS.length - missing.length}/${REQUIRED_ENV_VARS.length} set`)
  console.log(`Warnings: ${warnings.length}`)

  if (!isValid) {
    console.log('\n❌ Environment validation failed!')
    console.log('\nMissing required variables:')
    missing.forEach(varName => console.log(`  - ${varName}`))
    console.log('\nPlease set these variables in your .env.local file')
    process.exit(1)
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Environment warnings:')
    warnings.forEach(warning => console.log(`  - ${warning}`))
  }

  console.log('\n✅ Environment validation passed!')
  return true
}

function maskSensitive(varName, value) {
  const sensitiveVars = ['API_KEY', 'SECRET', 'TOKEN', 'PASSWORD']

  if (sensitiveVars.some(sensitive => varName.includes(sensitive))) {
    if (value.length > 10) {
      return `${value.substring(0, 6)}...${value.substring(value.length - 4)}`
    }
    return '***'
  }

  if (varName === 'SUPABASE_URL') {
    return value.length > 30 ? `${value.substring(0, 30)}...` : value
  }

  return value
}

// Test API connections if validation passes
async function testConnections() {
  console.log('\n🔗 Testing API connections...')

  try {
    // Test Supabase connection
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

    const { data, error } = await supabase.from('document_embeddings').select('id').limit(1)
    if (error) {
      console.log(`❌ Supabase: ${error.message}`)
    } else {
      console.log('✅ Supabase: Connected successfully')
    }

    // Test OpenAI (just validate key format)
    const openaiKey = process.env.OPENAI_API_KEY
    if (openaiKey && openaiKey.startsWith('sk-proj-')) {
      console.log('✅ OpenAI: Key format valid')
    } else {
      console.log('⚠️  OpenAI: Key format may be invalid')
    }

    // Test Anthropic (just validate key format)
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (anthropicKey && anthropicKey.startsWith('sk-ant-')) {
      console.log('✅ Anthropic: Key format valid')
    } else {
      console.log('⚠️  Anthropic: Key format may be invalid')
    }

  } catch (error) {
    console.log(`❌ Connection test failed: ${error.message}`)
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const isValid = validateEnvironment()

  if (isValid && process.argv.includes('--test-connections')) {
    await testConnections()
  }

  console.log('\n🚀 Ready for deployment!')
}