#!/usr/bin/env node

/**
 * MUVA Zone Validation Script
 *
 * Validates zones and subzones in the MUVA listings CSV against the official
 * zone mapping data. Reports inconsistencies and suggests corrections.
 */

const fs = require('fs');
const path = require('path');

// File paths
const LISTINGS_CSV = path.join(__dirname, '../_assets/muva/muva_listing.csv');
const ZONE_MAPPING = path.join(__dirname, '../_assets/muva/zone-mapping.json');

/**
 * Parse CSV content into structured data
 */
function parseListingsCSV(csvContent) {
  const lines = csvContent.split('\n');
  const zoneRow = lines[58]; // Row 59 (0-indexed): Zone data
  const subzoneRow = lines[59]; // Row 60 (0-indexed): Subzone data
  const nameRow = lines[2]; // Row 3 (0-indexed): Business names

  const zones = zoneRow.split(',').slice(1); // Remove first column header
  const subzones = subzoneRow.split(',').slice(1); // Remove first column header
  const names = nameRow.split(',').slice(1); // Remove first column header

  const listings = [];
  for (let i = 0; i < Math.min(zones.length, subzones.length, names.length); i++) {
    if (zones[i] && zones[i].trim() && names[i] && names[i].trim()) {
      listings.push({
        name: names[i].trim(),
        zone: zones[i].trim(),
        subzone: subzones[i] ? subzones[i].trim() : '',
        columnIndex: i + 1
      });
    }
  }

  return listings;
}

/**
 * Load zone mapping configuration
 */
function loadZoneMapping() {
  try {
    const mappingContent = fs.readFileSync(ZONE_MAPPING, 'utf8');
    return JSON.parse(mappingContent);
  } catch (error) {
    console.error('❌ Error loading zone mapping:', error.message);
    process.exit(1);
  }
}

/**
 * Validate a zone against the mapping
 */
function validateZone(zone, mapping) {
  const validZones = Object.keys(mapping.zones);
  return validZones.includes(zone);
}

/**
 * Validate a subzone against the mapping
 */
function validateSubzone(zone, subzone, mapping) {
  if (!zone || !subzone) return { valid: true, message: 'Empty subzone' };

  const zoneData = mapping.zones[zone];
  if (!zoneData) return { valid: false, message: 'Invalid zone' };

  // Check direct match (handle both array and object structure)
  const subzoneList = Array.isArray(zoneData.subzones) ?
    zoneData.subzones :
    Object.keys(zoneData.subzones);

  if (subzoneList.includes(subzone)) {
    return { valid: true, message: 'Exact match' };
  }

  // Check variations
  const variations = mapping.common_variations[subzone];
  if (variations) {
    for (const variation of variations) {
      if (subzoneList.includes(variation)) {
        return { valid: true, message: `Variation of ${variation}` };
      }
    }
  }

  // Check overlapping subzones
  const overlapping = mapping.overlapping_subzones[subzone];
  if (overlapping && overlapping.includes(zone)) {
    return { valid: true, message: 'Valid in overlapping zones' };
  }

  // Check unmapped subzones (known issues)
  if (mapping.unmapped_subzones_found_in_listings.includes(subzone)) {
    return { valid: false, message: 'Known unmapped subzone' };
  }

  return { valid: false, message: 'Not found in zone mapping' };
}

/**
 * Generate zone statistics
 */
function generateStats(listings, mapping) {
  const stats = {
    totalListings: listings.length,
    validZones: 0,
    invalidZones: 0,
    validSubzones: 0,
    invalidSubzones: 0,
    emptySubzones: 0,
    zoneDistribution: {},
    issues: []
  };

  for (const listing of listings) {
    // Zone validation
    if (validateZone(listing.zone, mapping)) {
      stats.validZones++;
    } else {
      stats.invalidZones++;
      stats.issues.push({
        type: 'invalid_zone',
        business: listing.name,
        zone: listing.zone,
        subzone: listing.subzone,
        column: listing.columnIndex
      });
    }

    // Subzone validation
    if (!listing.subzone) {
      stats.emptySubzones++;
    } else {
      const subzoneResult = validateSubzone(listing.zone, listing.subzone, mapping);
      if (subzoneResult.valid) {
        stats.validSubzones++;
      } else {
        stats.invalidSubzones++;
        stats.issues.push({
          type: 'invalid_subzone',
          business: listing.name,
          zone: listing.zone,
          subzone: listing.subzone,
          message: subzoneResult.message,
          column: listing.columnIndex
        });
      }
    }

    // Zone distribution
    stats.zoneDistribution[listing.zone] = (stats.zoneDistribution[listing.zone] || 0) + 1;
  }

  return stats;
}

/**
 * Main validation function
 */
function main() {
  console.log('🗺️  MUVA Zone Validation Report');
  console.log('=====================================\\n');

  // Load data
  console.log('📂 Loading data files...');

  if (!fs.existsSync(LISTINGS_CSV)) {
    console.error('❌ Listings CSV not found:', LISTINGS_CSV);
    process.exit(1);
  }

  if (!fs.existsSync(ZONE_MAPPING)) {
    console.error('❌ Zone mapping not found:', ZONE_MAPPING);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(LISTINGS_CSV, 'utf8');
  const mapping = loadZoneMapping();
  const listings = parseListingsCSV(csvContent);

  console.log(`✅ Loaded ${listings.length} listings`);
  console.log(`✅ Loaded mapping for ${Object.keys(mapping.zones).length} zones\\n`);

  // Generate validation report
  const stats = generateStats(listings, mapping);

  // Print summary
  console.log('📊 VALIDATION SUMMARY');
  console.log('---------------------');
  console.log(`Total listings: ${stats.totalListings}`);
  console.log(`Valid zones: ${stats.validZones} (${Math.round(stats.validZones/stats.totalListings*100)}%)`);
  console.log(`Invalid zones: ${stats.invalidZones}`);
  console.log(`Valid subzones: ${stats.validSubzones} (${Math.round(stats.validSubzones/(stats.totalListings-stats.emptySubzones)*100)}%)`);
  console.log(`Invalid subzones: ${stats.invalidSubzones}`);
  console.log(`Empty subzones: ${stats.emptySubzones}\\n`);

  // Zone distribution
  console.log('🗺️  ZONE DISTRIBUTION');
  console.log('--------------------');
  for (const [zone, count] of Object.entries(stats.zoneDistribution)) {
    const percentage = Math.round(count/stats.totalListings*100);
    const status = validateZone(zone, mapping) ? '✅' : '❌';
    console.log(`${status} ${zone}: ${count} listings (${percentage}%)`);
  }
  console.log();

  // Issues report
  if (stats.issues.length > 0) {
    console.log('⚠️  ISSUES FOUND');
    console.log('----------------');

    const zoneIssues = stats.issues.filter(i => i.type === 'invalid_zone');
    const subzoneIssues = stats.issues.filter(i => i.type === 'invalid_subzone');

    if (zoneIssues.length > 0) {
      console.log('\\n🔴 Invalid Zones:');
      for (const issue of zoneIssues) {
        console.log(`   Column ${issue.column}: "${issue.business}" - Zone: "${issue.zone}"`);
      }
    }

    if (subzoneIssues.length > 0) {
      console.log('\\n🟡 Invalid Subzones:');
      for (const issue of subzoneIssues) {
        console.log(`   Column ${issue.column}: "${issue.business}" - Subzone: "${issue.subzone}" in ${issue.zone} (${issue.message})`);
      }
    }
  } else {
    console.log('✅ No validation issues found!');
  }

  // Valid zones list
  console.log('\\n📋 VALID ZONES');
  console.log('---------------');
  for (const [zone, data] of Object.entries(mapping.zones)) {
    const subzoneCount = Array.isArray(data.subzones) ?
      data.subzones.length :
      Object.keys(data.subzones).length;
    console.log(`✅ ${zone}: ${subzoneCount} subzones`);
    console.log(`   "${data.description.substring(0, 80)}..."`);
  }

  console.log('\\n🎯 Validation complete!');

  // Exit with error code if issues found
  if (stats.issues.length > 0) {
    process.exit(1);
  }
}

// Run the validation
if (require.main === module) {
  main();
}

module.exports = {
  parseListingsCSV,
  loadZoneMapping,
  validateZone,
  validateSubzone,
  generateStats
};