#!/usr/bin/env node

/**
 * Analyze Template vs Reality
 *
 * Compares the documentation template with what actually works in the system
 * to identify needed improvements
 */

import fs from 'fs';

function analyzeTemplateIssues() {
  console.log('🔍 Template vs Reality Analysis\n');
  console.log('=' .repeat(60));

  console.log('\n📋 CURRENT TEMPLATE ISSUES:\n');

  const issues = [
    {
      field: 'document_type',
      template: 'sire-docs',
      reality: 'sire_docs',
      issue: 'Hyphen vs underscore - causes transform',
      fix: 'Use sire_docs directly'
    },
    {
      field: 'page_number',
      template: 'null',
      reality: 'not needed for markdown',
      issue: 'Unnecessary field for .md files',
      fix: 'Remove from markdown template'
    },
    {
      field: 'token_count',
      template: 'auto',
      reality: 'calculated number',
      issue: 'Placeholder vs actual calculation',
      fix: 'Remove from frontmatter'
    },
    {
      field: 'language',
      template: 'missing',
      reality: 'defaults to "es"',
      issue: 'Not specified, gets default',
      fix: 'Add language: es explicitly'
    },
    {
      field: 'keywords',
      template: '["term1", "term2"]',
      reality: 'stored with quotes in DB',
      issue: 'Array format inconsistency',
      fix: 'Improve parsing in script'
    },
    {
      field: 'timestamps',
      template: '"2025-09-19 18:30:00"',
      reality: '2025-09-19T18:30:00+00:00',
      issue: 'Missing timezone format',
      fix: 'Use ISO format or auto-convert'
    },
    {
      field: 'document_type values',
      template: 'Limited to 5 values',
      reality: 'Now supports 8 values',
      issue: 'Template not updated with new values',
      fix: 'Add muva, iot, ticketing'
    }
  ];

  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.field.toUpperCase()}`);
    console.log(`   Template: ${issue.template}`);
    console.log(`   Reality:  ${issue.reality}`);
    console.log(`   Issue:    ${issue.issue}`);
    console.log(`   Fix:      ${issue.fix}`);
    console.log('');
  });

  console.log('📊 COMPATIBILITY IMPROVEMENTS NEEDED:\n');

  const improvements = [
    '✅ Remove unnecessary fields (page_number, token_count)',
    '✅ Add missing required fields (language)',
    '✅ Fix format inconsistencies (document_type, timestamps)',
    '✅ Update allowed values (document_type options)',
    '✅ Improve field descriptions and examples',
    '✅ Add validation comments for better UX'
  ];

  improvements.forEach(improvement => {
    console.log(`   ${improvement}`);
  });

  console.log('\n🎯 GOAL: Increase compatibility from 57% to 95%+\n');
}

function generateNewTemplate() {
  console.log('📝 PROPOSED NEW TEMPLATE:\n');
  console.log('=' .repeat(60));

  const newTemplate = `---
# Identificación principal
title: "[DOCUMENT_TITLE]"
description: "[Brief description of purpose and key information covered]"
document_type: technical # OPTIONS: sire_docs|technical|regulatory|operational|template|muva|iot|ticketing
category: technical # OPTIONS: technical|regulatory|operational

# Metadata adicional
section_title: "[Section or Chapter Title]" # Para navegación dentro del documento
language: es # REQUIRED: es|en|pt (Spanish by default)

# Tags y búsqueda (múltiples valores permitidos)
tags: [primary_domain, document_type, key_concept]
keywords: [key_term_1, key_term_2, key_term_3] # Will be stored as PostgreSQL array

# Control de versiones
status: production-ready # OPTIONS: active|draft|production-ready
version: "1.0"
updated_at: "2025-09-19T18:35:00Z" # ISO format with timezone
created_at: "2025-09-19T18:35:00Z" # ISO format with timezone

# NOTES:
# - page_number: Only needed for PDF documents (omit for markdown)
# - token_count: Calculated automatically (omit from frontmatter)
# - embedding_model: Set automatically to text-embedding-3-large
---`;

  console.log(newTemplate);

  console.log('\n\n🔧 KEY IMPROVEMENTS:\n');

  const improvements = [
    '✅ document_type uses underscore format (sire_docs vs sire-docs)',
    '✅ Added all 8 supported document_type values',
    '✅ Explicit language field with default',
    '✅ Removed unnecessary page_number and token_count',
    '✅ ISO timestamp format with timezone',
    '✅ Better comments explaining options and behavior',
    '✅ Notes section explaining omitted fields'
  ];

  improvements.forEach(improvement => {
    console.log(`   ${improvement}`);
  });
}

function main() {
  console.log('🎯 Template Optimization Analysis\n');

  analyzeTemplateIssues();
  generateNewTemplate();

  console.log('\n' + '='.repeat(60));
  console.log('📋 NEXT STEPS:');
  console.log('1. Update documentation-template.md');
  console.log('2. Improve populate-embeddings.js parsing');
  console.log('3. Update existing document frontmatters');
  console.log('4. Test compatibility improvements');
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}