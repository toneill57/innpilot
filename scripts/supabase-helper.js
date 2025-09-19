#!/usr/bin/env node

/**
 * Supabase Helper Script - Always Uses Correct Tokens
 *
 * This script reads tokens from .env.local and provides helper functions
 * for common Supabase operations. Use this instead of hardcoding tokens.
 *
 * Usage:
 *   node scripts/supabase-helper.js db-push
 *   node scripts/supabase-helper.js migration apply [file]
 *   node scripts/supabase-helper.js check-status
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

// Load environment variables
dotenv.config({ path: '.env.local' });

function getSupabaseTokens() {
  return {
    PAT: process.env.SUPABASE_PAT,
    URL: process.env.SUPABASE_URL,
    ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  };
}

function validateTokens() {
  const tokens = getSupabaseTokens();

  if (!tokens.PAT) {
    console.error('❌ SUPABASE_PAT not found in .env.local');
    return false;
  }

  if (!tokens.URL) {
    console.error('❌ SUPABASE_URL not found in .env.local');
    return false;
  }

  console.log('✅ All required tokens found');
  console.log(`   PAT: ${tokens.PAT.substring(0, 10)}...`);
  console.log(`   URL: ${tokens.URL}`);

  return true;
}

function executeSupabaseCommand(command, args = []) {
  const tokens = getSupabaseTokens();

  if (!validateTokens()) {
    process.exit(1);
  }

  const fullCommand = `SUPABASE_ACCESS_TOKEN="${tokens.PAT}" npx supabase ${command} ${args.join(' ')}`;

  console.log(`🔧 Executing: ${command} ${args.join(' ')}`);
  console.log(`   Using PAT: ${tokens.PAT.substring(0, 10)}...`);

  try {
    const output = execSync(fullCommand, { encoding: 'utf8', stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ Command failed: ${error.message}`);
    return false;
  }
}

function dbPush() {
  console.log('🗄️ Pushing database changes...\n');
  return executeSupabaseCommand('db', ['push']);
}

function dbPull() {
  console.log('📥 Pulling database changes...\n');
  return executeSupabaseCommand('db', ['pull']);
}

function migrationRepair(migrationId) {
  console.log(`🔧 Repairing migration ${migrationId}...\n`);
  return executeSupabaseCommand('migration', ['repair', '--status', 'reverted', migrationId]);
}

function checkStatus() {
  console.log('📊 Checking Supabase status...\n');

  if (!validateTokens()) {
    return false;
  }

  // Check if we can connect to the project
  return executeSupabaseCommand('projects', ['list']);
}

function showHelp() {
  console.log(`
🗄️ Supabase Helper Script

Usage:
  node scripts/supabase-helper.js <command> [args]

Commands:
  db-push              Push local migrations to remote database
  db-pull              Pull remote database schema to local
  migration-repair ID  Repair a migration by ID
  check-status         Check connection and project status
  help                 Show this help

Examples:
  node scripts/supabase-helper.js db-push
  node scripts/supabase-helper.js migration-repair 20250119
  node scripts/supabase-helper.js check-status

This script automatically uses the correct tokens from .env.local
  `);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    return;
  }

  const command = args[0];

  switch (command) {
    case 'db-push':
      dbPush();
      break;

    case 'db-pull':
      dbPull();
      break;

    case 'migration-repair':
      if (args.length < 2) {
        console.error('❌ Migration ID required');
        console.log('Usage: node scripts/supabase-helper.js migration-repair <migration-id>');
        process.exit(1);
      }
      migrationRepair(args[1]);
      break;

    case 'check-status':
      checkStatus();
      break;

    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  getSupabaseTokens,
  validateTokens,
  executeSupabaseCommand,
  dbPush,
  dbPull,
  migrationRepair,
  checkStatus
};