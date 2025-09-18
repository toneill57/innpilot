import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

async function checkCurrentData() {
  console.log('📊 Checking current database state...')

  const { data, error, count } = await supabase
    .from('document_embeddings')
    .select('*', { count: 'exact' })
    .limit(5)

  if (error) {
    console.error('❌ Error checking database:', error.message)
    return false
  }

  console.log(`📄 Total documents found: ${count}`)

  if (count > 0) {
    console.log('📋 Sample documents:')
    data.forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.source_file} (${doc.document_type}) - ${doc.content.substring(0, 50)}...`)
    })
  }

  return { count, data }
}

async function clearAllEmbeddings() {
  console.log('🗑️  Starting database cleanup...')

  try {
    // Delete all documents by not using any filter (this deletes everything)
    const { error } = await supabase
      .from('document_embeddings')
      .delete()
      .gte('created_at', '1900-01-01') // This will match all records

    if (error) {
      console.error('❌ Error deleting documents:', error.message)
      return false
    }

    console.log('✅ All embeddings successfully deleted!')
    return true

  } catch (error) {
    console.error('❌ Unexpected error during cleanup:', error.message)
    return false
  }
}

async function verifyCleanup() {
  console.log('🔍 Verifying cleanup...')

  const { data, error, count } = await supabase
    .from('document_embeddings')
    .select('*', { count: 'exact' })

  if (error) {
    console.error('❌ Error verifying cleanup:', error.message)
    return false
  }

  console.log(`📊 Documents remaining: ${count}`)

  if (count === 0) {
    console.log('✅ Database successfully cleaned!')
    return true
  } else {
    console.log('⚠️  Some documents may still remain')
    return false
  }
}

async function main() {
  console.log('🚀 Starting database cleanup process...\n')

  // Step 1: Check current state
  const currentState = await checkCurrentData()

  if (!currentState || currentState.count === 0) {
    console.log('ℹ️  Database is already empty. Nothing to clean.')
    return
  }

  console.log('\n' + '='.repeat(60))
  console.log('⚠️  WARNING: This will DELETE ALL embeddings from the database!')
  console.log('   This action cannot be undone.')
  console.log('='.repeat(60))

  // For automation, we'll proceed directly
  // In a real scenario, you might want to add confirmation prompts

  console.log('\n🗑️  Proceeding with cleanup...')

  // Step 2: Clear all embeddings
  const cleanupSuccess = await clearAllEmbeddings()

  if (!cleanupSuccess) {
    console.log('❌ Cleanup failed. Exiting.')
    process.exit(1)
  }

  // Step 3: Verify cleanup
  const verificationSuccess = await verifyCleanup()

  if (verificationSuccess) {
    console.log('\n🎉 Database cleanup completed successfully!')
    console.log('📝 The database is now ready for new tests.')
    console.log('💡 Use "npm run populate-embeddings" to repopulate when needed.')
  } else {
    console.log('\n⚠️  Cleanup verification failed. Please check manually.')
  }
}

// Run the cleanup
main().catch(console.error)