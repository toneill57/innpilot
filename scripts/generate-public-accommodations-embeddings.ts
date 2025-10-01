/**
 * Generate embeddings for accommodation_units_public
 *
 * Usage: npx tsx scripts/generate-public-accommodations-embeddings.ts
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiKey = process.env.OPENAI_API_KEY!

if (!supabaseUrl || !supabaseKey || !openaiKey) {
  console.error('❌ Missing required environment variables:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗')
  console.error('  - OPENAI_API_KEY:', openaiKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const openai = new OpenAI({ apiKey: openaiKey })

async function generateEmbedding(text: string, dimensions: number): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
    dimensions,
  })

  return response.data[0].embedding
}

async function main() {
  console.log('🔄 Fetching accommodations without embeddings...')

  // Fetch all accommodations
  const { data: accommodations, error } = await supabase
    .from('accommodation_units_public')
    .select('*')
    .is('embedding_fast', null)

  if (error) {
    console.error('❌ Error fetching accommodations:', error)
    process.exit(1)
  }

  if (!accommodations || accommodations.length === 0) {
    console.log('✅ All accommodations already have embeddings!')
    return
  }

  console.log(`📝 Processing ${accommodations.length} accommodations...`)

  for (const unit of accommodations) {
    console.log(`\n🏠 ${unit.name} (${unit.unit_number})`)

    // Build marketing-focused text for embedding
    const highlights = Array.isArray(unit.highlights) ? unit.highlights.join(', ') : ''
    const amenities = unit.amenities || {}
    const amenitiesText = Object.entries(amenities)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')

    const embeddingText = `
${unit.name}
${unit.description}
${unit.short_description || ''}
Highlights: ${highlights}
Type: ${unit.unit_type}
Amenities: ${amenitiesText}
    `.trim()

    console.log(`   Text length: ${embeddingText.length} chars`)

    try {
      // Generate Tier 1 (1024d) - Fast
      console.log('   Generating Tier 1 embedding (1024d)...')
      const embeddingFast = await generateEmbedding(embeddingText, 1024)

      // Generate Tier 3 (3072d) - Full
      console.log('   Generating Tier 3 embedding (3072d)...')
      const embeddingFull = await generateEmbedding(embeddingText, 3072)

      // Update database
      const { error: updateError } = await supabase
        .from('accommodation_units_public')
        .update({
          embedding_fast: embeddingFast,
          embedding: embeddingFull,
        })
        .eq('unit_id', unit.unit_id)

      if (updateError) {
        console.error(`   ❌ Error updating embeddings:`, updateError)
      } else {
        console.log(`   ✅ Embeddings generated and saved`)
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`   ❌ Error generating embeddings:`, error)
    }
  }

  console.log('\n✅ Done!')
}

main().catch(console.error)
