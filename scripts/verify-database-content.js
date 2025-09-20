import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verifyDatabaseContent() {
  console.log('🔍 Verificando contenido actual de la base de datos...')

  try {
    // Get existing embeddings to see if "untrusted-data" exists
    const { data: documents, error: docError } = await supabase
      .from('document_embeddings')
      .select('content, source_file, document_type, chunk_index')
      .order('source_file, chunk_index')

    if (docError) {
      console.error('❌ Error fetching document_embeddings:', docError.message)
      return
    }

    console.log(`\n📊 Found ${documents.length} records in document_embeddings`)

    // Check for "untrusted-data" text in existing records
    const suspiciousRecords = documents.filter(doc =>
      doc.content.includes('untrusted-data') ||
      doc.content.includes('<untrusted-data-')
    )

    if (suspiciousRecords.length > 0) {
      console.log(`\n⚠️ Found ${suspiciousRecords.length} records containing "untrusted-data"!`)
      suspiciousRecords.forEach((record, i) => {
        console.log(`\n--- Suspicious Record ${i + 1} ---`)
        console.log('Source File:', record.source_file)
        console.log('Document Type:', record.document_type)
        console.log('Chunk Index:', record.chunk_index)
        console.log('Content (first 200 chars):')
        console.log(record.content.substring(0, 200) + '...')
        console.log('--- End Record ---')
      })
    } else {
      console.log('✅ No "untrusted-data" text found in existing embeddings')
    }

    // Show a sample of normal records
    console.log('\n📄 Sample of existing records:')
    documents.slice(0, 3).forEach((record, i) => {
      console.log(`\n--- Sample Record ${i + 1} ---`)
      console.log('Source File:', record.source_file)
      console.log('Document Type:', record.document_type)
      console.log('Chunk Index:', record.chunk_index)
      console.log('Content (first 200 chars):')
      console.log(record.content.substring(0, 200))
      console.log('--- End Record ---')
    })

    // Check MUVA embeddings too
    const { data: muvaData, error: muvaError } = await supabase
      .from('muva_embeddings')
      .select('content, source_file, chunk_index')
      .order('source_file, chunk_index')

    if (muvaError) {
      console.error('❌ Error fetching muva_embeddings:', muvaError.message)
      return
    }

    console.log(`\n📊 Found ${muvaData.length} records in muva_embeddings`)

    const muvaSuspicious = muvaData.filter(doc =>
      doc.content.includes('untrusted-data') ||
      doc.content.includes('<untrusted-data-')
    )

    if (muvaSuspicious.length > 0) {
      console.log(`\n⚠️ Found ${muvaSuspicious.length} MUVA records containing "untrusted-data"!`)
      muvaSuspicious.forEach((record, i) => {
        console.log(`\n--- Suspicious MUVA Record ${i + 1} ---`)
        console.log('Source File:', record.source_file)
        console.log('Chunk Index:', record.chunk_index)
        console.log('Content (first 200 chars):')
        console.log(record.content.substring(0, 200) + '...')
        console.log('--- End Record ---')
      })
    } else {
      console.log('✅ No "untrusted-data" text found in MUVA embeddings')
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message)
  }
}

verifyDatabaseContent()