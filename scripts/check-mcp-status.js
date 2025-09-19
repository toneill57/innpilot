#!/usr/bin/env node

/**
 * MCP Status Checker for InnPilot
 *
 * This script verifies the MCP configuration and provides troubleshooting info
 * Run: node scripts/check-mcp-status.js
 */

import { execSync } from 'child_process';

console.log('🔧 Checking MCP Configuration Status\n');

try {
  // Check MCP server status
  console.log('📡 MCP Server Status:');
  const mcpList = execSync('claude mcp list', { encoding: 'utf8' });
  console.log(mcpList);

  // Check if Supabase server is connected
  const isSupabaseConnected = mcpList.includes('✓ Connected');

  if (isSupabaseConnected) {
    console.log('✅ Supabase MCP server is connected');

    // Get server details
    console.log('\n📋 Server Configuration:');
    const mcpDetails = execSync('claude mcp get supabase', { encoding: 'utf8' });
    console.log(mcpDetails);

    console.log('\n💡 Note: MCP tools will be available in NEW Claude Code sessions.');
    console.log('📝 To use MCP tools, start a new Claude Code session.');

  } else {
    console.log('❌ Supabase MCP server is not connected');
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check if Supabase token is valid');
    console.log('2. Verify project reference is correct');
    console.log('3. Try removing and re-adding the server');
  }

  // Alternative database access
  console.log('\n🔄 Alternative: Direct database access');
  console.log('Use this script for direct Supabase queries:');
  console.log('node scripts/direct-supabase-query.js');

} catch (error) {
  console.error('❌ Error checking MCP status:', error.message);
  console.log('\n🔧 Try installing Claude Code or checking your configuration');
}