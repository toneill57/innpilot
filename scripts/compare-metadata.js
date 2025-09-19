#!/usr/bin/env node

/**
 * Compare Document Metadata
 *
 * Compares the frontmatter metadata in source files with what's stored in the database
 * to verify that metadata is being read and stored correctly
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function extractFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: null, content };
  }

  const frontmatterText = match[1];
  const contentWithoutFrontmatter = content.replace(frontmatterRegex, '').trim();

  // Parse YAML-like frontmatter
  const frontmatter = {};
  const lines = frontmatterText.split('\n');

  lines.forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return;

    let key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();

    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Parse arrays
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(v => v.trim().replace(/"/g, ''));
    }

    frontmatter[key] = value;
  });

  return { frontmatter, content: contentWithoutFrontmatter };
}

async function compareDocumentMetadata(filePath) {
  const filename = path.basename(filePath);

  console.log(`\n📄 Analyzing: ${filename}`);
  console.log('=' .repeat(50));

  try {
    // Read source file frontmatter
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter } = extractFrontmatter(fileContent);

    if (!frontmatter) {
      console.log('❌ No frontmatter found in source file');
      return;
    }

    console.log('\n📋 Source File Frontmatter:');
    Object.entries(frontmatter).forEach(([key, value]) => {
      const valueStr = Array.isArray(value) ? `[${value.join(', ')}]` : String(value);
      console.log(`   ${key}: ${valueStr}`);
    });

    // Get database records for this file
    const { data: dbRecords, error } = await supabase
      .from('document_embeddings')
      .select('*')
      .eq('source_file', filename)
      .limit(1);

    if (error) {
      console.log('❌ Error querying database:', error.message);
      return;
    }

    if (dbRecords.length === 0) {
      console.log('❌ No database records found for this file');
      return;
    }

    const dbRecord = dbRecords[0];

    console.log('\n🗄️ Database Record Metadata:');

    // Compare key metadata fields
    const metadataFields = [
      'title',
      'description',
      'document_type',
      'category',
      'section_title',
      'page_number',
      'status',
      'version',
      'updated_at',
      'created_at',
      'tags',
      'keywords',
      'language',
      'token_count'
    ];

    let matches = 0;
    let total = 0;

    metadataFields.forEach(field => {
      const sourceValue = frontmatter[field];
      const dbValue = dbRecord[field];

      if (sourceValue !== undefined || dbValue !== null) {
        total++;

        let match = false;
        let comparison = '';

        if (field === 'document_type') {
          // Handle document_type transformation (sire-docs -> sire_docs)
          const normalizedSource = sourceValue?.toLowerCase().replace('-', '_');
          match = normalizedSource === dbValue;
          comparison = `${sourceValue || 'null'} -> ${dbValue || 'null'}`;
        } else if (Array.isArray(sourceValue) && typeof dbValue === 'string') {
          // Handle array fields that might be stored as strings
          const dbArray = dbValue.split(',').map(s => s.trim().replace(/"/g, ''));
          match = JSON.stringify(sourceValue) === JSON.stringify(dbArray);
          comparison = `[${sourceValue.join(', ')}] -> ${dbValue}`;
        } else if (field === 'tags' && Array.isArray(sourceValue) && Array.isArray(dbValue)) {
          // Direct array comparison for tags
          match = JSON.stringify(sourceValue) === JSON.stringify(dbValue);
          comparison = `[${sourceValue.join(', ')}] -> [${dbValue.join(', ')}]`;
        } else {
          match = sourceValue === dbValue;
          comparison = `${sourceValue || 'null'} -> ${dbValue || 'null'}`;
        }

        if (match) matches++;

        const status = match ? '✅' : '❌';
        console.log(`   ${status} ${field}: ${comparison}`);
      }
    });

    console.log(`\n📊 Metadata Accuracy: ${matches}/${total} fields match (${Math.round(matches/total*100)}%)`);

    // Check for any extra database fields
    console.log('\n🔍 Additional Database Fields:');
    const extraFields = ['embedding_model', 'chunk_index', 'total_chunks'];
    extraFields.forEach(field => {
      if (dbRecord[field] !== null && dbRecord[field] !== undefined) {
        console.log(`   ✅ ${field}: ${dbRecord[field]}`);
      }
    });

  } catch (error) {
    console.error(`❌ Error analyzing ${filename}:`, error.message);
  }
}

async function main() {
  console.log('🔍 Document Metadata Comparison Tool\n');

  // Check connection
  console.log('🔗 Testing connection...');
  const { error: connectionError } = await supabase
    .from('document_embeddings')
    .select('count', { count: 'exact', head: true });

  if (connectionError) {
    console.error('❌ Connection failed:', connectionError.message);
    return;
  }

  console.log('✅ Connection successful');

  // Documents to analyze
  const documents = [
    '/Users/oneill/Sites/apps/InnPilot/SNAPSHOT.md',
    '/Users/oneill/Sites/apps/InnPilot/_assets/sire/pasos-para-reportar-al-sire.md'
  ];

  for (const docPath of documents) {
    if (fs.existsSync(docPath)) {
      await compareDocumentMetadata(docPath);
    } else {
      console.log(`❌ File not found: ${docPath}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Metadata comparison complete');
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}