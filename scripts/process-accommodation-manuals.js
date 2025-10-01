import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import matter from 'gray-matter'
import { glob } from 'glob'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.dirname(__dirname)

// Load environment variables
config({ path: path.join(projectRoot, '.env.local') })

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Generate embedding with specific dimensions
async function generateEmbedding(text, dimensions) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
    dimensions,
  })
  return response.data[0].embedding
}

// Extract structured content from manual
function extractManualContent(markdown) {
  const { data: frontmatter, content } = matter(markdown)

  // Extract key sections
  const sections = {
    wifi: extractSection(content, /## Conectividad/i, /### WiFi/i),
    ac: extractSection(content, /## Aire Acondicionado/i),
    appliances: extractSection(content, /## Mini-Cocina y Electrodomésticos/i),
    emergency: extractSection(content, /## Emergencias/i),
    tips: extractSection(content, /## Tips Específicos/i),
  }

  // Extract WiFi password
  const wifiPasswordMatch = content.match(/\*\*Contraseña\*\*:\s*`([^`]+)`/)
  const wifiPassword = wifiPasswordMatch ? wifiPasswordMatch[1] : null

  return {
    frontmatter,
    content,
    sections,
    wifiPassword,
  }
}

// Extract a section from markdown
function extractSection(markdown, startPattern, endPattern = null) {
  const startMatch = markdown.match(startPattern)
  if (!startMatch) return ''

  const startIndex = startMatch.index
  let endIndex = markdown.length

  if (endPattern) {
    const endMatch = markdown.slice(startIndex + 1).match(/^##\s/m)
    if (endMatch) {
      endIndex = startIndex + 1 + endMatch.index
    }
  }

  return markdown.slice(startIndex, endIndex).trim()
}

// Find unit_id by unit name
async function findUnitIdByName(unitName, tenantId) {
  const { data, error } = await supabase
    .from('accommodation_units_public')
    .select('unit_id, name')
    .eq('tenant_id', tenantId)
    .ilike('name', unitName)
    .single()

  if (error || !data) {
    console.warn(`⚠️  Unit not found in database: "${unitName}"`)
    return null
  }

  console.log(`   ✓ Matched: "${unitName}" → unit_id: ${data.unit_id}`)
  return data.unit_id
}

// Process a single manual file
async function processManualFile(filePath) {
  console.log(`\n📄 Processing: ${path.basename(filePath)}`)

  try {
    // Read file
    const markdown = fs.readFileSync(filePath, 'utf-8')
    const manual = extractManualContent(markdown)

    // Get unit info from frontmatter
    const unitName = manual.frontmatter.unit_reference?.unit_name
    const tenantId = manual.frontmatter.tenant_id

    if (!unitName) {
      console.error(`   ❌ No unit_name in frontmatter`)
      return { success: false, error: 'Missing unit_name' }
    }

    console.log(`   Unit: ${unitName}`)
    console.log(`   Tenant: ${tenantId}`)

    // Find unit_id in database
    const unitId = await findUnitIdByName(unitName, tenantId)
    if (!unitId) {
      return { success: false, error: 'Unit not found in database' }
    }

    // Generate embeddings
    console.log(`   🧮 Generating embeddings...`)
    const embedding1536 = await generateEmbedding(manual.content, 1536)
    const embedding3072 = await generateEmbedding(manual.content, 3072)
    console.log(`   ✓ Embeddings generated (1536d + 3072d)`)

    // Prepare appliance guides
    const applianceGuides = {
      ac: manual.sections.ac,
      mini_kitchen: manual.sections.appliances,
    }

    // Update accommodation_units_manual
    const { error: updateError } = await supabase
      .from('accommodation_units_manual')
      .update({
        manual_content: manual.content,
        detailed_instructions: manual.sections.appliances || null,
        house_rules_specific: null, // Not in current manual structure
        emergency_info: manual.sections.emergency || null,
        wifi_password: manual.wifiPassword,
        appliance_guides: applianceGuides,
        local_tips: manual.sections.tips || null,
        embedding_balanced: embedding1536,
        embedding: embedding3072,
        updated_at: new Date().toISOString(),
      })
      .eq('unit_id', unitId)

    if (updateError) {
      console.error(`   ❌ Database update failed:`, updateError.message)
      return { success: false, error: updateError.message }
    }

    console.log(`   ✅ Updated accommodation_units_manual`)

    return {
      success: true,
      unitName,
      unitId,
      hasWifi: !!manual.wifiPassword,
      contentLength: manual.content.length,
    }

  } catch (error) {
    console.error(`   ❌ Error:`, error.message)
    return { success: false, error: error.message }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting accommodation manual processing...\n')

  // Find all manual files
  const manualFiles = await glob('_assets/simmerdown/accommodations-manual/**/*-manual.md', {
    cwd: projectRoot,
    absolute: true,
  })

  console.log(`Found ${manualFiles.length} manual files\n`)

  const results = []

  for (const filePath of manualFiles) {
    const result = await processManualFile(filePath)
    results.push({ file: path.basename(filePath), ...result })
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 PROCESSING SUMMARY')
  console.log('='.repeat(60))

  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  console.log(`✅ Successful: ${successful}/${results.length}`)
  console.log(`❌ Failed: ${failed}/${results.length}`)

  if (failed > 0) {
    console.log('\nFailed files:')
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.file}: ${r.error}`)
    })
  }

  console.log('\n✨ Processing complete!')
}

// Run
main().catch(console.error)
