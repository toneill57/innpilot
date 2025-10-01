/**
 * Generate real embeddings for accommodation_units_public
 *
 * Run: npx tsx scripts/generate-accommodation-embeddings.ts
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiKey = process.env.OPENAI_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)
const openai = new OpenAI({ apiKey: openaiKey })

async function generateEmbedding(text: string, dimensions: number): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
    dimensions: dimensions,
    encoding_format: 'float',
  })
  return response.data[0].embedding
}

async function main() {
  console.log('🔍 Fetching accommodations without embeddings...')

  const { data: units, error } = await supabase
    .from('accommodation_units_public')
    .select('*')
    .is('embedding_fast', null)
    .or('embedding_fast.is.null')

  if (error) {
    console.error('❌ Error fetching units:', error)
    return
  }

  // Also get units with dummy embeddings (all 0.1)
  const { data: allUnits } = await supabase
    .from('accommodation_units_public')
    .select('*')

  const unitsToProcess = allUnits || []

  if (!unitsToProcess.length) {
    console.log('✅ No accommodations to process')
    return
  }

  console.log(`📦 Processing ${unitsToProcess.length} accommodations...`)

  for (const unit of unitsToProcess) {
    console.log(`\n🏠 Processing: ${unit.name}`)

    // Build content for embedding
    const content = `
${unit.name}
${unit.description}

Type: ${unit.unit_type}
Highlights: ${JSON.stringify(unit.highlights)}
Amenities: ${JSON.stringify(unit.amenities)}
`.trim()

    console.log('  📝 Generating 1024d embedding...')
    const embedding1024 = await generateEmbedding(content, 1024)

    console.log('  📝 Generating 3072d embedding...')
    const embedding3072 = await generateEmbedding(content, 3072)

    // Update unit
    const { error: updateError } = await supabase
      .from('accommodation_units_public')
      .update({
        embedding_fast: embedding1024,
        embedding: embedding3072,
      })
      .eq('unit_id', unit.unit_id)

    if (updateError) {
      console.error('  ❌ Error updating unit:', updateError)
    } else {
      console.log('  ✅ Embeddings generated and saved')
    }

    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('\n✅ All accommodations processed!')
}

main().catch(console.error)
