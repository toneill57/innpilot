#!/usr/bin/env node

/**
 * Delete Documents from InnPilot Database
 *
 * Deletes all documents from document_embeddings table
 * Run: node scripts/delete-documents.js
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCurrentState() {
  console.log('📊 Checking current database state...\n');

  const { count, error } = await supabase
    .from('document_embeddings')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Error checking state:', error.message);
    return null;
  }

  console.log(`📄 Current documents: ${count}`);

  if (count > 0) {
    // Get sample of what will be deleted
    const { data: sample, error: sampleError } = await supabase
      .from('document_embeddings')
      .select('source_file, chunk_index')
      .limit(3);

    if (!sampleError && sample.length > 0) {
      console.log('\n📋 Sample documents to be deleted:');
      sample.forEach(doc => {
        console.log(`- ${doc.source_file} (chunk ${doc.chunk_index})`);
      });
    }
  }

  return count;
}

async function deleteAllDocuments() {
  console.log('\n🗑️ Deleting all documents from database...');

  const { error } = await supabase
    .from('document_embeddings')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

  if (error) {
    console.error('❌ Deletion failed:', error.message);
    return false;
  }

  console.log('✅ Documents deleted successfully');
  return true;
}

async function verifyDeletion() {
  console.log('\n🔍 Verifying deletion...');

  const { count, error } = await supabase
    .from('document_embeddings')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Error verifying deletion:', error.message);
    return false;
  }

  console.log(`📊 Remaining documents: ${count}`);

  if (count === 0) {
    console.log('✅ Database is now empty');
    return true;
  } else {
    console.log('⚠️ Some documents remain in the database');
    return false;
  }
}

async function main() {
  console.log('🗄️ InnPilot Document Deletion Tool\n');

  // Check connection
  console.log('🔗 Testing connection...');
  const { error: connectionError } = await supabase
    .from('document_embeddings')
    .select('count', { count: 'exact', head: true });

  if (connectionError) {
    console.error('❌ Connection failed:', connectionError.message);
    console.log('\n🔧 Check your .env.local file configuration');
    return;
  }

  console.log('✅ Connection successful\n');

  try {
    // Step 1: Check current state
    const currentCount = await checkCurrentState();

    if (currentCount === null) {
      console.log('❌ Failed to check current state');
      return;
    }

    if (currentCount === 0) {
      console.log('\n💡 Database is already empty - nothing to delete');
      return;
    }

    // Step 2: Confirm deletion
    console.log(`\n⚠️ About to delete ${currentCount} documents`);
    console.log('🔄 Proceeding with deletion...');

    // Step 3: Delete documents
    const deleteSuccess = await deleteAllDocuments();

    if (!deleteSuccess) {
      console.log('❌ Deletion failed');
      return;
    }

    // Step 4: Verify deletion
    const verifySuccess = await verifyDeletion();

    if (verifySuccess) {
      console.log('\n🎉 All documents successfully deleted from database');
    } else {
      console.log('\n⚠️ Deletion completed but verification shows remaining documents');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { deleteAllDocuments, checkCurrentState, verifyDeletion };