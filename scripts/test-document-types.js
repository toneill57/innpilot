#!/usr/bin/env node

/**
 * Test Document Types
 *
 * Tests that all document_type values are accepted by the database constraint
 * Run this AFTER applying the constraint migration
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDocumentType(docType) {
  console.log(`🧪 Testing document_type: "${docType}"`);

  try {
    // Try to insert a test record
    const { error: insertError } = await supabase
      .from('document_embeddings')
      .insert({
        content: `test_${docType}_${Date.now()}`,
        document_type: docType,
        source_file: 'test.md',
        chunk_index: 0,
        total_chunks: 1
      });

    if (insertError) {
      console.log(`   ❌ Failed: ${insertError.message}`);
      return false;
    }

    console.log(`   ✅ Success: "${docType}" is accepted`);

    // Clean up the test record
    await supabase
      .from('document_embeddings')
      .delete()
      .eq('document_type', docType)
      .like('content', `test_${docType}_%`);

    return true;

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testAllDocumentTypes() {
  console.log('🔬 Testing All Document Types\n');

  // All values that should be accepted after the constraint update
  const testValues = [
    'sire_docs',     // Existing - should work
    'regulatory',    // Existing - should work
    'technical',     // Template value - should work after migration
    'operational',   // Template value - should work after migration
    'template',      // Template value - should work after migration
    'muva',          // Project value - should work after migration
    'iot',           // Project value - should work after migration
    'ticketing'      // Project value - should work after migration
  ];

  const results = {};
  let allPassed = true;

  for (const docType of testValues) {
    const success = await testDocumentType(docType);
    results[docType] = success;
    if (!success) allPassed = false;
  }

  console.log('\n📊 Test Results Summary:');
  console.log('========================');

  for (const [docType, success] of Object.entries(results)) {
    const status = success ? '✅' : '❌';
    console.log(`${status} ${docType}`);
  }

  if (allPassed) {
    console.log('\n🎉 All document_type values are working correctly!');
    console.log('✅ Database constraint has been successfully updated');
  } else {
    console.log('\n⚠️  Some document_type values failed');
    console.log('💡 Make sure you have applied the constraint migration in Supabase');
  }

  return allPassed;
}

async function checkCurrentConstraint() {
  console.log('🔍 Checking current constraint status...\n');

  // Test with a value that should fail if old constraint is still active
  const { error } = await supabase
    .from('document_embeddings')
    .insert({
      content: 'constraint_test',
      document_type: 'technical',
      source_file: 'test.md',
      chunk_index: 0,
      total_chunks: 1
    });

  if (error) {
    if (error.message.includes('violates check constraint')) {
      console.log('⚠️  Old constraint still active - migration not applied yet');
      console.log('📋 Next step: Apply the migration in Supabase Dashboard');
      return false;
    } else {
      console.log('❌ Unexpected error:', error.message);
      return false;
    }
  } else {
    console.log('✅ New constraint is active - "technical" value accepted');
    // Clean up test record
    await supabase.from('document_embeddings').delete().eq('content', 'constraint_test');
    return true;
  }
}

async function main() {
  console.log('🗄️ Document Type Constraint Tester\n');

  // Check connection
  console.log('🔗 Testing connection...');
  const { error: connectionError } = await supabase
    .from('document_embeddings')
    .select('count', { count: 'exact', head: true });

  if (connectionError) {
    console.error('❌ Connection failed:', connectionError.message);
    return;
  }

  console.log('✅ Connection successful\n');

  // Check if new constraint is applied
  const constraintUpdated = await checkCurrentConstraint();

  if (!constraintUpdated) {
    console.log('\n📋 Instructions:');
    console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Open SQL Editor');
    console.log('3. Execute the migration: supabase/migrations/20250919000001_update_document_type_constraint.sql');
    console.log('4. Run this test again');
    return;
  }

  // Test all document types
  const allTestsPassed = await testAllDocumentTypes();

  if (allTestsPassed) {
    console.log('\n🚀 Ready to proceed:');
    console.log('1. Run: node scripts/revert-document-type-workaround.js');
    console.log('2. Re-populate: node scripts/populate-embeddings.js');
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { testDocumentType, testAllDocumentTypes, checkCurrentConstraint };