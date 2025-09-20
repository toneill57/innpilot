#!/usr/bin/env node

/**
 * MUVA Data Enrichment Script
 *
 * Enriches MUVA listings with detailed zone and market segment information.
 * Validates consistency between prices, segments, and locations.
 */

const fs = require('fs');
const path = require('path');

// File paths
const LISTINGS_CSV = path.join(__dirname, '../_assets/muva/muva_listing.csv');
const ZONE_MAPPING = path.join(__dirname, '../_assets/muva/zone-mapping.json');
const MARKET_SEGMENTS = path.join(__dirname, '../_assets/muva/market-segments.json');

/**
 * Parse CSV content into structured data
 */
function parseListingsCSV(csvContent) {
  const lines = csvContent.split('\n');
  const nameRow = lines[2];           // Business names
  const categoryRow = lines[1];       // Categories
  const descriptionRow = lines[3];    // Descriptions
  const scheduleRow = lines[4];       // Schedules
  const priceRow = lines[5];          // Prices
  const zoneRow = lines[58];          // Zones
  const subzoneRow = lines[59];       // Subzones
  const segmentationRow = lines[60];  // Target audience
  const contactRow = lines[61];       // Contact info
  const keywordsRow = lines[65];      // Keywords

  const names = nameRow.split(',').slice(1);
  const categories = categoryRow.split(',').slice(1);
  const descriptions = descriptionRow.split(',').slice(1);
  const schedules = scheduleRow.split(',').slice(1);
  const prices = priceRow.split(',').slice(1);
  const zones = zoneRow.split(',').slice(1);
  const subzones = subzoneRow.split(',').slice(1);
  const segmentations = segmentationRow.split(',').slice(1);
  const contacts = contactRow.split(',').slice(1);
  const keywords = keywordsRow.split(',').slice(1);

  const listings = [];
  for (let i = 0; i < names.length; i++) {
    if (names[i] && names[i].trim()) {
      listings.push({
        name: names[i].trim(),
        category: categories[i] ? categories[i].trim() : '',
        description: descriptions[i] ? descriptions[i].trim() : '',
        schedule: schedules[i] ? schedules[i].trim() : '',
        price: prices[i] ? prices[i].trim() : '',
        zone: zones[i] ? zones[i].trim() : '',
        subzone: subzones[i] ? subzones[i].trim() : '',
        segmentation: segmentations[i] ? segmentations[i].trim() : '',
        contact: contacts[i] ? contacts[i].trim() : '',
        keywords: keywords[i] ? keywords[i].trim() : '',
        columnIndex: i + 1
      });
    }
  }

  return listings;
}

/**
 * Load JSON data files
 */
function loadJSONData() {
  try {
    const zoneMapping = JSON.parse(fs.readFileSync(ZONE_MAPPING, 'utf8'));
    const marketSegments = JSON.parse(fs.readFileSync(MARKET_SEGMENTS, 'utf8'));
    return { zoneMapping, marketSegments };
  } catch (error) {
    console.error('❌ Error loading JSON data:', error.message);
    process.exit(1);
  }
}

/**
 * Enrich listing with zone data
 */
function enrichWithZoneData(listing, zoneMapping) {
  const zone = listing.zone;
  const subzone = listing.subzone;

  if (!zone || !zoneMapping.zones[zone]) {
    return { error: `Zone '${zone}' not found in mapping` };
  }

  const zoneData = zoneMapping.zones[zone];
  const subzoneData = zoneData.subzones[subzone];

  return {
    zone_description: zoneData.description,
    zone_characteristics: zoneData.characteristics,
    general_noise_level: zoneData.general_noise_level,
    transport: zoneData.transport,
    proximity_to_airport: zoneData.proximity_to_airport,
    subzone_description: subzoneData ? subzoneData.description : '',
    noise_level: subzoneData ? subzoneData.noise_level : '',
    noise_notes: subzoneData ? subzoneData.noise_notes : '',
    security_level: subzoneData ? subzoneData.security_level : '',
    landmarks: subzoneData ? subzoneData.landmarks || [] : [],
    warnings: subzoneData ? subzoneData.warnings || [] : [],
    recommendations: subzoneData ? subzoneData.recommendations || [] : [],
    ideal_for: subzoneData ? subzoneData.ideal_for || [] : [],
    coastal_features: subzoneData ? subzoneData.coastal_features : ''
  };
}

/**
 * Enrich listing with market segment data
 */
/**
 * Normalize segment name for lookup
 */
function normalizeSegmentName(segment) {
  return segment
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
}

/**
 * Common segment name variations and aliases
 */
const SEGMENT_VARIATIONS = {
  'low cost': ['low_cost', 'lowcost', 'bajo_costo', 'economico'],
  'low_cost': ['low cost', 'lowcost', 'bajo_costo', 'economico'],
  'eco friendly': ['eco_friendly', 'ecofriendly', 'eco-friendly', 'ecologico'],
  'eco_friendly': ['eco friendly', 'ecofriendly', 'eco-friendly', 'ecologico'],
  'night life': ['nightlife', 'night_life', 'vida_nocturna', 'nocturno'],
  'nightlife': ['night life', 'night_life', 'vida_nocturna', 'nocturno'],
  'aventurero': ['adventure', 'adventurer', 'aventura'],
  'mochilero': ['backpacker', 'mochila', 'backpack'],
  'soltero': ['single', 'solo', 'individual'],
  'negocios': ['business', 'trabajo', 'corporativo'],
  'lujo': ['luxury', 'premium', 'alto_nivel']
};

/**
 * Find segment data with intelligent matching
 */
function findSegmentData(segment, marketSegments) {
  const originalSegment = segment.trim();
  const normalizedSegment = normalizeSegmentName(segment);

  // 1. Direct lookup with normalized name
  let data = marketSegments.segments[normalizedSegment];
  if (data) return { data, matchType: 'exact', matchedKey: normalizedSegment };

  // 2. Direct lookup with original casing
  data = marketSegments.segments[originalSegment];
  if (data) return { data, matchType: 'exact', matchedKey: originalSegment };

  // 3. Try predefined variations
  const segmentVariations = SEGMENT_VARIATIONS[originalSegment.toLowerCase()] ||
                           SEGMENT_VARIATIONS[normalizedSegment] || [];

  for (const variation of segmentVariations) {
    const normalizedVariation = normalizeSegmentName(variation);
    data = marketSegments.segments[normalizedVariation];
    if (data) return { data, matchType: 'variation', matchedKey: normalizedVariation };

    // Also try the variation as-is
    data = marketSegments.segments[variation];
    if (data) return { data, matchType: 'variation', matchedKey: variation };
  }

  // 4. Try common transformations
  const transformations = [
    segment.toLowerCase().replace(/\s+/g, ''),     // Remove all spaces
    segment.toLowerCase().replace(/\s+/g, '-'),    // Use dashes
    segment.toLowerCase().replace(/-/g, '_'),      // Convert dashes to underscores
    segment.toLowerCase().replace(/\s+/g, '_'),    // Spaces to underscores
    segment.toLowerCase().replace(/_/g, ' '),      // Underscores to spaces
    segment.toLowerCase().replace(/-/g, ' ')       // Dashes to spaces
  ];

  for (const transformation of transformations) {
    data = marketSegments.segments[transformation];
    if (data) return { data, matchType: 'transformation', matchedKey: transformation };
  }

  // 5. Fuzzy matching - check if segment contains any known segment names
  for (const [key, segmentData] of Object.entries(marketSegments.segments)) {
    const keyLower = key.toLowerCase();
    const segmentLower = originalSegment.toLowerCase();

    // Check partial matches
    if (keyLower.includes(segmentLower) || segmentLower.includes(keyLower)) {
      return { data: segmentData, matchType: 'fuzzy', matchedKey: key };
    }
  }

  return { data: null, matchType: 'not_found', matchedKey: null };
}

/**
 * Get suggestions for unmatched segments
 */
function getSuggestions(segment, marketSegments) {
  const segmentLower = segment.toLowerCase();
  const suggestions = [];

  // Find segments with similar names
  for (const [key, data] of Object.entries(marketSegments.segments)) {
    const keyLower = key.toLowerCase();

    // Calculate simple similarity
    if (keyLower.includes(segmentLower.substring(0, 3)) ||
        segmentLower.includes(keyLower.substring(0, 3))) {
      suggestions.push({
        key: key,
        name: data.name,
        similarity: 'partial'
      });
    }
  }

  // Limit to top 3 suggestions
  return suggestions.slice(0, 3);
}

function enrichWithSegmentData(listing, marketSegments) {
  // Check if segmentation field is empty
  if (!listing.segmentation || listing.segmentation.trim() === '') {
    return {
      segment_descriptions: [],
      budget_ranges: [],
      interests_alignment: [],
      transport_preferences: [],
      status: 'empty',
      message: 'No segmentation data provided - may not apply to this business'
    };
  }

  const segments = listing.segmentation.split(',').map(s => s.trim()).filter(s => s.length > 0);
  const segmentData = [];
  const budgetRanges = [];
  const interests = [];
  const transportPrefs = [];
  const matchResults = [];

  for (const segment of segments) {
    const result = findSegmentData(segment, marketSegments);
    matchResults.push({
      original: segment,
      matchType: result.matchType,
      found: !!result.data,
      matchedKey: result.matchedKey || null,
      suggestions: result.matchType === 'not_found' ? getSuggestions(segment, marketSegments) : []
    });

    if (result.data) {
      segmentData.push({
        name: result.data.name,
        description: result.data.description,
        characteristics: result.data.characteristics,
        daily_budget: result.data.daily_budget,
        matchType: result.matchType,
        originalSegment: segment,
        matchedKey: result.matchedKey
      });

      budgetRanges.push(`${result.data.daily_budget.min.toLocaleString()} - ${result.data.daily_budget.max.toLocaleString()} ${result.data.daily_budget.currency}`);
      interests.push(...result.data.interests);
      transportPrefs.push(...result.data.preferred_transport);
    }
  }

  const foundCount = segmentData.length;
  const totalCount = segments.length;

  return {
    segment_descriptions: segmentData,
    budget_ranges: budgetRanges,
    interests_alignment: [...new Set(interests)],
    transport_preferences: [...new Set(transportPrefs)],
    status: foundCount === totalCount ? 'complete' : foundCount > 0 ? 'partial' : 'failed',
    match_results: matchResults,
    coverage: `${foundCount}/${totalCount} segments found`
  };
}

/**
 * Validate price against target segments
 */
function validatePriceSegmentAlignment(listing, enrichedSegmentData) {
  const priceText = listing.price.toLowerCase();
  const issues = [];

  // Extract numeric values from price string
  const priceNumbers = priceText.match(/\\d{1,3}(?:,\\d{3})*/g);
  if (!priceNumbers) return { valid: true, issues: [] };

  const minPrice = Math.min(...priceNumbers.map(p => parseInt(p.replace(/,/g, ''))));
  const maxPrice = Math.max(...priceNumbers.map(p => parseInt(p.replace(/,/g, ''))));

  // Check alignment with segment budgets
  for (const segment of enrichedSegmentData.segment_descriptions) {
    const segmentMin = segment.daily_budget.min;
    const segmentMax = segment.daily_budget.max;

    if (maxPrice > segmentMax * 0.5) { // If business price > 50% of daily budget
      issues.push(`Price range may be high for ${segment.name} segment (${segmentMin.toLocaleString()}-${segmentMax.toLocaleString()} COP daily budget)`);
    }
  }

  return {
    valid: issues.length === 0,
    issues: issues,
    price_analysis: {
      extracted_min: minPrice,
      extracted_max: maxPrice,
      segments_checked: enrichedSegmentData.segment_descriptions.length
    }
  };
}

/**
 * Generate enrichment report for a listing
 */
function generateListingReport(listing, zoneEnrichment, segmentEnrichment, priceValidation) {
  return {
    business: listing.name,
    category: listing.category,
    location: {
      zone: listing.zone,
      subzone: listing.subzone,
      noise_level: zoneEnrichment.noise_level,
      security_level: zoneEnrichment.security_level,
      proximity_to_airport: zoneEnrichment.proximity_to_airport
    },
    segments: segmentEnrichment.segment_descriptions.map(s => s.name),
    budget_ranges: segmentEnrichment.budget_ranges,
    enrichment_data: {
      zone_data_complete: !!zoneEnrichment.zone_description,
      subzone_data_complete: !!zoneEnrichment.subzone_description,
      segment_data_complete: segmentEnrichment.segment_descriptions.length > 0,
      landmarks_count: zoneEnrichment.landmarks ? zoneEnrichment.landmarks.length : 0,
      warnings_count: zoneEnrichment.warnings ? zoneEnrichment.warnings.length : 0
    },
    price_validation: priceValidation,
    column: listing.columnIndex
  };
}

/**
 * Main enrichment function
 */
function main() {
  console.log('🌟 MUVA Data Enrichment Analysis');
  console.log('=================================\\n');

  // Load data
  console.log('📂 Loading data files...');

  if (!fs.existsSync(LISTINGS_CSV)) {
    console.error('❌ Listings CSV not found:', LISTINGS_CSV);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(LISTINGS_CSV, 'utf8');
  const { zoneMapping, marketSegments } = loadJSONData();
  const listings = parseListingsCSV(csvContent);

  console.log(`✅ Loaded ${listings.length} listings`);
  console.log(`✅ Loaded ${Object.keys(zoneMapping.zones).length} zones with detailed subzone data`);
  console.log(`✅ Loaded ${Object.keys(marketSegments.segments).length} market segments\\n`);

  // Process each listing
  const reports = [];
  const summary = {
    total_processed: 0,
    zone_enriched: 0,
    segment_enriched: 0,
    price_issues: 0,
    complete_enrichment: 0
  };

  for (const listing of listings) {
    summary.total_processed++;

    // Enrich with zone data
    const zoneEnrichment = enrichWithZoneData(listing, zoneMapping);
    if (!zoneEnrichment.error) summary.zone_enriched++;

    // Enrich with segment data
    const segmentEnrichment = enrichWithSegmentData(listing, marketSegments);
    if (segmentEnrichment.status === 'complete' || segmentEnrichment.status === 'partial') {
      summary.segment_enriched++;
    }

    // Validate price alignment
    const priceValidation = validatePriceSegmentAlignment(listing, segmentEnrichment);
    if (!priceValidation.valid) summary.price_issues++;

    // Check complete enrichment
    if (!zoneEnrichment.error &&
        segmentEnrichment.segment_descriptions.length > 0 &&
        priceValidation.valid) {
      summary.complete_enrichment++;
    }

    // Generate report
    const report = generateListingReport(listing, zoneEnrichment, segmentEnrichment, priceValidation);
    reports.push(report);
  }

  // Calculate detailed segment statistics
  const segmentStats = {
    total_listings: summary.total_processed,
    listings_with_segments: 0,
    listings_without_segments: 0,
    match_type_counts: {
      exact: 0,
      variation: 0,
      transformation: 0,
      fuzzy: 0,
      not_found: 0
    }
  };

  // Collect detailed statistics from reports
  for (const report of reports) {
    if (report.segments && report.segments.length > 0) {
      segmentStats.listings_with_segments++;
    } else {
      segmentStats.listings_without_segments++;
    }
  }

  // Print summary
  console.log('📊 ENRICHMENT SUMMARY');
  console.log('---------------------');
  console.log(`Total listings processed: ${summary.total_processed}`);
  console.log(`Zone data enriched: ${summary.zone_enriched} (${Math.round(summary.zone_enriched/summary.total_processed*100)}%)`);
  console.log(`Segment data enriched: ${summary.segment_enriched} (${Math.round(summary.segment_enriched/summary.total_processed*100)}%)`);
  console.log(`  • With segments: ${segmentStats.listings_with_segments}`);
  console.log(`  • Without segments: ${segmentStats.listings_without_segments} (may not apply to business)`);
  console.log(`Price validation issues: ${summary.price_issues}`);
  console.log(`Complete enrichment: ${summary.complete_enrichment} (${Math.round(summary.complete_enrichment/summary.total_processed*100)}%)\\n`);

  // Show sample enriched data
  console.log('🔍 SAMPLE ENRICHED DATA');
  console.log('------------------------');
  const sampleListing = reports[0];
  console.log(`Business: ${sampleListing.business}`);
  console.log(`Zone: ${sampleListing.location.zone} (${sampleListing.location.noise_level} noise, ${sampleListing.location.security_level} security)`);
  console.log(`Segments: ${sampleListing.segments.join(', ')}`);
  console.log(`Budget ranges: ${sampleListing.budget_ranges.join(', ')}`);
  console.log(`Enrichment complete: ${Object.values(sampleListing.enrichment_data).every(v => v === true || v > 0)}\\n`);

  // Show issues if any
  const issueReports = reports.filter(r => !r.price_validation.valid || r.enrichment_data.zone_data_complete === false);
  if (issueReports.length > 0) {
    console.log('⚠️  ISSUES FOUND');
    console.log('----------------');

    for (const report of issueReports.slice(0, 5)) { // Show first 5 issues
      console.log(`\\n📍 ${report.business} (Column ${report.column}):`);

      if (!report.enrichment_data.zone_data_complete) {
        console.log('   🔴 Missing zone data');
      }

      if (!report.price_validation.valid) {
        for (const issue of report.price_validation.issues) {
          console.log(`   🟡 ${issue}`);
        }
      }
    }

    if (issueReports.length > 5) {
      console.log(`\\n   ... and ${issueReports.length - 5} more issues`);
    }
  } else {
    console.log('✅ No enrichment issues found!');
  }

  console.log('\\n🎯 Data enrichment analysis complete!');
  console.log('\\n💡 The enriched data is ready to be used by the muva-doc-embedder agent.');

  // Exit with error code if critical issues found
  if (summary.zone_enriched < summary.total_processed * 0.9) {
    console.log('\\n❌ Warning: Less than 90% zone enrichment rate');
    process.exit(1);
  }
}

// Run the enrichment analysis
if (require.main === module) {
  main();
}

module.exports = {
  parseListingsCSV,
  enrichWithZoneData,
  enrichWithSegmentData,
  validatePriceSegmentAlignment,
  generateListingReport
};