import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

async function checkForDuplicates() {
  try {
    console.log('🔍 Checking for duplicate documents in database...')

    const { data, error } = await supabase
      .from('document_embeddings')
      .select('source_file, document_title, chunk_index, total_chunks, created_at')
      .order('source_file', { ascending: true })
      .order('chunk_index', { ascending: true })

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log('📊 Documents in database:')
    console.log('========================')

    const groupedByFile = {}
    data.forEach(doc => {
      if (!groupedByFile[doc.source_file]) {
        groupedByFile[doc.source_file] = []
      }
      groupedByFile[doc.source_file].push(doc)
    })

    Object.keys(groupedByFile).forEach(filename => {
      const docs = groupedByFile[filename]
      console.log(`\n📄 ${filename}:`)
      console.log(`   Title: ${docs[0].document_title || 'No title'}`)
      console.log(`   Chunks: ${docs.length} (expected: ${docs[0].total_chunks})`)
      console.log(`   Created: ${docs[0].created_at}`)

      // Check for duplicates based on creation time
      const creationDates = docs.map(d => d.created_at.split('T')[0])
      const creationTimes = docs.map(d => d.created_at.split('T')[1].split('.')[0])
      const uniqueTimes = [...new Set(creationTimes)]

      if (uniqueTimes.length > 1) {
        console.log(`   ⚠️  Multiple creation times detected - possible duplicates!`)
        uniqueTimes.forEach((time, i) => {
          const count = docs.filter(d => d.created_at.includes(time)).length
          console.log(`      Time ${i+1}: ${time} (${count} chunks)`)
        })
      } else {
        console.log(`   ✅ Single creation time - no duplicates detected`)
      }

      // Check if chunk count matches expected
      if (docs.length !== docs[0].total_chunks) {
        console.log(`   ⚠️  Chunk count mismatch: found ${docs.length}, expected ${docs[0].total_chunks}`)
      }
    })

    console.log(`\n📊 Summary:`)
    console.log(`   Total unique files: ${Object.keys(groupedByFile).length}`)
    console.log(`   Total chunks: ${data.length}`)

    // Check for the specific SIRE document
    const sireDoc = groupedByFile['pasos-para-reportar-al-sire.md']
    if (sireDoc) {
      console.log(`\n🎯 SIRE Document Analysis:`)
      console.log(`   File: pasos-para-reportar-al-sire.md`)
      console.log(`   Chunks found: ${sireDoc.length}`)
      console.log(`   Expected chunks: ${sireDoc[0].total_chunks}`)
      console.log(`   Status: ${sireDoc.length === sireDoc[0].total_chunks ? '✅ Complete' : '⚠️ Incomplete'}`)

      // Check creation times for this specific document
      const sireCreationTimes = [...new Set(sireDoc.map(d => d.created_at.split('T')[1].split('.')[0].substring(0, 8)))]
      console.log(`   Creation times: ${sireCreationTimes.length} unique`)
      if (sireCreationTimes.length > 1) {
        console.log(`   ⚠️ Document uploaded multiple times!`)
      } else {
        console.log(`   ✅ Document uploaded once`)
      }
    }

  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

checkForDuplicates()