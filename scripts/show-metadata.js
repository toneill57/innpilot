import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

async function showMetadata() {
  try {
    console.log('📊 Document Metadata Analysis')
    console.log('=' .repeat(50))

    const { data, error } = await supabase
      .from('document_embeddings')
      .select(`
        source_file,
        document_type,
        document_title,
        document_description,
        document_category,
        document_status,
        document_version,
        document_last_updated,
        document_tags,
        document_keywords,
        language,
        embedding_model,
        chunk_index,
        total_chunks,
        created_at
      `)
      .order('source_file', { ascending: true })
      .order('chunk_index', { ascending: true })
      .limit(10)

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log(`\n📋 Sample of ${data.length} records:\n`)

    data.forEach((doc, index) => {
      console.log(`\n📄 Record ${index + 1}:`)
      console.log(`   Source File: ${doc.source_file}`)
      console.log(`   Document Type: ${doc.document_type}`)
      console.log(`   Title: ${doc.document_title || 'No title'}`)
      console.log(`   Description: ${doc.document_description?.substring(0, 80) || 'No description'}${doc.document_description?.length > 80 ? '...' : ''}`)
      console.log(`   Category: ${doc.document_category || 'No category'}`)
      console.log(`   Status: ${doc.document_status || 'No status'}`)
      console.log(`   Version: ${doc.document_version || 'No version'}`)
      console.log(`   Last Updated: ${doc.document_last_updated || 'No date'}`)
      console.log(`   Tags: ${doc.document_tags || 'No tags'}`)
      console.log(`   Keywords: ${doc.document_keywords || 'No keywords'}`)
      console.log(`   Language: ${doc.language}`)
      console.log(`   Embedding Model: ${doc.embedding_model}`)
      console.log(`   Chunk: ${doc.chunk_index + 1}/${doc.total_chunks}`)
      console.log(`   Created: ${doc.created_at}`)
    })

    // Summary by file
    console.log('\n' + '='.repeat(50))
    console.log('📊 Files Summary:')

    const { data: summary, error: summaryError } = await supabase
      .from('document_embeddings')
      .select(`
        source_file,
        document_title,
        document_type,
        language,
        embedding_model,
        chunk_index
      `)

    if (summaryError) {
      console.error('❌ Summary Error:', summaryError)
      return
    }

    const fileGroups = {}
    summary.forEach(doc => {
      if (!fileGroups[doc.source_file]) {
        fileGroups[doc.source_file] = {
          title: doc.document_title,
          type: doc.document_type,
          language: doc.language,
          model: doc.embedding_model,
          chunks: 0
        }
      }
      fileGroups[doc.source_file].chunks++
    })

    Object.keys(fileGroups).forEach(filename => {
      const file = fileGroups[filename]
      console.log(`\n📁 ${filename}:`)
      console.log(`   Title: ${file.title || 'No title'}`)
      console.log(`   Type: ${file.type}`)
      console.log(`   Language: ${file.language}`)
      console.log(`   Model: ${file.model}`)
      console.log(`   Total Chunks: ${file.chunks}`)
    })

  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

showMetadata()