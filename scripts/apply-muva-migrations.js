#!/usr/bin/env node

// Apply MUVA migrations to Supabase database

import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration(migrationFile) {
  try {
    console.log(`📥 Applying migration: ${migrationFile}`)

    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', migrationFile)
    const migrationSQL = await fs.readFile(migrationPath, 'utf8')

    console.log(`📄 Migration content preview: ${migrationSQL.substring(0, 100)}...`)

    const { data, error } = await supabase.rpc('exec_sql', {
      query: migrationSQL
    })

    if (error) {
      console.error(`❌ Error applying ${migrationFile}:`, error)

      // Try direct query instead
      console.log('🔄 Trying direct query...')
      const { data: directData, error: directError } = await supabase
        .from('dummy_table_that_does_not_exist')
        .select('*')
        .limit(0)

      if (directError) {
        console.log('📝 Applying migration line by line...')
        const lines = migrationSQL.split(';').filter(line => line.trim().length > 0)

        for (const line of lines) {
          if (line.trim().length > 0) {
            console.log(`  Executing: ${line.trim().substring(0, 50)}...`)
            // Skip comments and empty lines
            if (line.trim().startsWith('--') || line.trim().length === 0) {
              continue
            }

            try {
              // This won't work with rpc, but we'll try anyway
              console.log('⚠️  Please apply this migration manually in Supabase Dashboard > SQL Editor:')
              console.log('=' * 60)
              console.log(migrationSQL)
              console.log('=' * 60)
              return false
            } catch (lineError) {
              console.error(`❌ Error executing line: ${lineError}`)
            }
          }
        }
      }

      return false
    }

    console.log(`✅ Successfully applied: ${migrationFile}`)
    return true
  } catch (error) {
    console.error(`❌ Failed to apply ${migrationFile}:`, error)
    return false
  }
}

async function main() {
  console.log('🏝️ Applying MUVA migrations to Supabase')
  console.log('==========================================')

  const migrations = [
    '20250919150000_create_muva_embeddings_table.sql',
    '20250919150001_create_match_muva_documents_function.sql'
  ]

  // Check if migrations exist
  for (const migration of migrations) {
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', migration)
    try {
      await fs.access(migrationPath)
      console.log(`✅ Found migration: ${migration}`)
    } catch (error) {
      console.error(`❌ Migration file not found: ${migration}`)
      process.exit(1)
    }
  }

  console.log('\n📋 Please apply these migrations manually in Supabase Dashboard:')
  console.log('1. Go to https://supabase.com/dashboard')
  console.log('2. Select your project (InnPilot)')
  console.log('3. Go to SQL Editor')
  console.log('4. Copy and execute each migration file:\n')

  for (const migration of migrations) {
    console.log(`📄 Migration: ${migration}`)
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', migration)
    const migrationSQL = await fs.readFile(migrationPath, 'utf8')

    console.log('SQL to execute:')
    console.log('```sql')
    console.log(migrationSQL)
    console.log('```\n')
  }

  console.log('🎯 After applying both migrations, run:')
  console.log('   node scripts/populate-muva-embeddings.js')
  console.log('   to load sample tourism data.')
}

main().catch(console.error)