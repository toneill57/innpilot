#!/usr/bin/env node

/**
 * Apply MUVA Template Script
 *
 * Applies the simplified MUVA documentation template to listings without template applied.
 * Only uses metadata fields from the current template, avoiding excessive metadata.
 */

import fs from 'fs';
import path from 'path';

const LISTINGS_DIR = '/Users/oneill/Sites/apps/InnPilot/_assets/muva/listings';
const TEMPLATE_PATH = '/Users/oneill/Sites/apps/InnPilot/_assets/templates/muva-docs-template.md';
const CSV_PATH = '/Users/oneill/Sites/apps/InnPilot/_assets/muva/muva_listing.csv';

/**
 * Parse the existing listings CSV to extract business data
 */
function parseListingsCSV() {
  const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = csvContent.split('\n');

  const nameRow = lines[2];
  const categoryRow = lines[1];
  const descriptionRow = lines[3];
  const scheduleRow = lines[4];
  const priceRow = lines[5];
  const zoneRow = lines[58];
  const subzoneRow = lines[59];
  const contactRow = lines[61];
  const keywordsRow = lines[65];

  const names = nameRow.split(',').slice(1);
  const categories = categoryRow.split(',').slice(1);
  const descriptions = descriptionRow.split(',').slice(1);
  const schedules = scheduleRow.split(',').slice(1);
  const prices = priceRow.split(',').slice(1);
  const zones = zoneRow.split(',').slice(1);
  const subzones = subzoneRow.split(',').slice(1);
  const contacts = contactRow.split(',').slice(1);
  const keywords = keywordsRow.split(',').slice(1);

  const listings = {};
  for (let i = 0; i < names.length; i++) {
    if (names[i] && names[i].trim()) {
      const name = names[i].trim();
      listings[name] = {
        name,
        category: categories[i] ? categories[i].trim() : '',
        description: descriptions[i] ? descriptions[i].trim() : '',
        schedule: schedules[i] ? schedules[i].trim() : '',
        price: prices[i] ? prices[i].trim() : '',
        zone: zones[i] ? zones[i].trim() : '',
        subzone: subzones[i] ? subzones[i].trim() : '',
        contact: contacts[i] ? contacts[i].trim() : '',
        keywords: keywords[i] ? keywords[i].trim().split(' ') : []
      };
    }
  }

  return listings;
}

/**
 * Check if file already has template applied
 */
function hasTemplateApplied(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('document_type: muva') && content.includes('business_type:');
}

/**
 * Find files that need template applied
 */
function findFilesNeedingTemplate() {
  const files = [];

  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item.endsWith('.md') && !item.includes('.bak') && !item.includes('copy')) {
        if (!hasTemplateApplied(fullPath)) {
          files.push(fullPath);
        }
      }
    }
  }

  scanDirectory(LISTINGS_DIR);
  return files;
}

/**
 * Extract existing content from a file
 */
function extractExistingContent(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Split between metadata and content
  const parts = content.split('---');
  if (parts.length >= 3) {
    return '---' + parts.slice(2).join('---');
  }

  // If no frontmatter, return all content
  return content;
}

/**
 * Parse existing simple metadata from file
 */
function parseExistingMetadata(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const metadata = {
    name: '',
    description: '',
    category: '',
    schedule: '',
    price: '',
    zone: '',
    contact: '',
    keywords: []
  };

  // Extract basic info from content structure
  for (const line of lines) {
    if (line.startsWith('# ')) {
      metadata.name = line.replace('# ', '').trim();
    } else if (line.includes('Categoría:')) {
      metadata.category = line.split(':')[1]?.trim() || '';
    } else if (line.includes('Zona:')) {
      metadata.zone = line.split(':')[1]?.trim() || '';
    } else if (line.includes('Horario:')) {
      metadata.schedule = line.split(':')[1]?.trim() || '';
    } else if (line.includes('Precio:')) {
      metadata.price = line.split(':')[1]?.trim() || '';
    }
  }

  return metadata;
}

/**
 * Generate template metadata for a business
 */
function generateTemplateMetadata(businessData, csvData) {
  const csvMatch = csvData[businessData.name] || {};

  return `---
name: "${businessData.name}"
description: "${csvMatch.description || businessData.description || 'Descripción del negocio o actividad'}"
document_type: muva
business_type: "${csvMatch.category || businessData.category || 'Restaurante'}"
tags: [${businessData.keywords?.map(k => `"${k}"`).join(', ') || '"tag1", "tag2"'}]
keywords: [${businessData.keywords?.map(k => `"${k}"`).join(', ') || '"keyword1", "keyword2"'}]
status: active
version: "1.0"
search_terms: "${csvMatch.zone || businessData.zone || 'Centro'} ${csvMatch.subzone || businessData.subzone || 'Centro'} ${csvMatch.category || businessData.category || 'Restaurante'}"
location:
  zone: "${csvMatch.zone || businessData.zone || 'Centro'}"
  zone_description: "[AUTO-FILLED from zone-mapping.json]"
  subzone_description: "[AUTO-FILLED from zone-mapping.json]"
  zone_features:
  - "[AUTO-FILLED_FEATURE_1]"
  - "[AUTO-FILLED_FEATURE_2]"
  - "[AUTO-FILLED_FEATURE_3]"
business_hours:
  schedule: "${csvMatch.schedule || businessData.schedule || '[HOURS]'}"
  days_closed: "[IF_APPLICABLE]"
pricing:
  range: "${csvMatch.price || businessData.price || '[PRICE_RANGE]'}"
  currency: "COP"
  payment_methods: ["cash", "card", "transfer"]
  commission_info: "[IF_APPLICABLE]"
contact:
  whatsapp: "${csvMatch.contact || businessData.contact || '[WHATSAPP_NUMBER]'}"
  email: "[EMAIL_ADDRESS]"
  instagram: "[INSTAGRAM_HANDLE]"
  website: "[WEBSITE_URL]"
  physical_address: "[IF_AVAILABLE]"
amenities:
  pet_friendly: false
  "420_friendly": false
  vegetarian_options: false
  wheelchair_accessible: false
  wifi_available: false
  parking_available: false
  english_speaking_staff: false
  accepts_reservations: false
metadata:
  menu_info: "[IF_RESTAURANT]"
  last_menu_update: null
  historical_significance: "[IF_APPLICABLE]"
  updated_at: "2025-09-20T00:00:00Z"
  created_at: "2025-09-20T00:00:00Z"
---`;
}

/**
 * Apply template to a single file
 */
function applyTemplateToFile(filePath, csvData) {
  console.log(`📝 Processing: ${path.basename(filePath)}`);

  // Extract existing metadata and content
  const existingMetadata = parseExistingMetadata(filePath);
  const existingContent = extractExistingContent(filePath);

  // Generate new template metadata
  const templateMetadata = generateTemplateMetadata(existingMetadata, csvData);

  // Combine template metadata with existing content
  const newContent = templateMetadata + '\n\n' + existingContent.replace(/^---[\s\S]*?---\n?/, '');

  // Write the updated file
  fs.writeFileSync(filePath, newContent, 'utf8');

  console.log(`✅ Applied template to ${path.basename(filePath)}`);
}

/**
 * Main execution
 */
function main() {
  console.log('🔄 MUVA Template Application');
  console.log('============================\n');

  // Load CSV data
  console.log('📂 Loading CSV data...');
  const csvData = parseListingsCSV();
  console.log(`✅ Loaded ${Object.keys(csvData).length} business entries\n`);

  // Find files needing template
  console.log('🔍 Finding files that need template...');
  const filesNeedingTemplate = findFilesNeedingTemplate();
  console.log(`📋 Found ${filesNeedingTemplate.length} files needing template:\n`);

  filesNeedingTemplate.forEach(file => {
    console.log(`  - ${path.relative(LISTINGS_DIR, file)}`);
  });

  if (filesNeedingTemplate.length === 0) {
    console.log('\n🎉 All files already have template applied!');
    return;
  }

  console.log('\n🚀 Applying template to files...\n');

  // Apply template to each file
  let processed = 0;
  for (const filePath of filesNeedingTemplate) {
    try {
      applyTemplateToFile(filePath, csvData);
      processed++;
    } catch (error) {
      console.error(`❌ Error processing ${path.basename(filePath)}:`, error.message);
    }
  }

  console.log(`\n🎯 Summary:`);
  console.log(`   ✅ Successfully processed: ${processed} files`);
  console.log(`   ❌ Errors: ${filesNeedingTemplate.length - processed} files`);
  console.log(`\n✨ Template application complete!`);
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, applyTemplateToFile, findFilesNeedingTemplate };