#!/usr/bin/env node

/**
 * Check Document Types in Database
 *
 * This script checks what document_type values are stored in the database
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDocumentTypes() {
  console.log('📊 Checking Document Types in Database');
  console.log('=====================================\n');

  try {
    // Get all embeddings with their metadata
    const { data, error } = await supabase
      .from('document_embeddings')
      .select('source_file, document_type, chunk_index, created_at')
      .order('source_file, chunk_index');

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    // Group by source file
    const grouped = {};
    data.forEach(row => {
      if (!grouped[row.source_file]) {
        grouped[row.source_file] = {
          document_type: row.document_type,
          chunks: [],
          created_at: row.created_at
        };
      }
      grouped[row.source_file].chunks.push(row.chunk_index);
    });

    // Display results
    console.log('📄 Documents in Database:');
    Object.entries(grouped).forEach(([file, info]) => {
      console.log(`\n📄 ${file}`);
      console.log(`   Type: ${info.document_type || 'NULL'}`);
      console.log(`   Chunks: ${info.chunks.length} [${Math.min(...info.chunks)}-${Math.max(...info.chunks)}]`);
      console.log(`   Created: ${new Date(info.created_at).toLocaleDateString()}`);
    });

    // Show unique document types
    console.log('\n🏷️  Unique Document Types:');
    const uniqueTypes = [...new Set(data.map(row => row.document_type))];
    uniqueTypes.forEach(type => {
      const count = data.filter(row => row.document_type === type).length;
      console.log(`   - ${type || 'NULL'}: ${count} chunks`);
    });

  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

// Run the check
checkDocumentTypes().catch(console.error);