/**
 * Sync ALL accommodations from MotoPress (including Jammin')
 */

async function syncAll() {
  const response = await fetch('http://localhost:3000/api/integrations/motopress/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tenant_id: 'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf'
      // No selected_ids = sync ALL
    })
  })

  const result = await response.json()

  if (result.success) {
    console.log('✅ All accommodations synced!')
    console.log(`   Created: ${result.data.created}`)
    console.log(`   Updated: ${result.data.updated}`)
    console.log(`   Total: ${result.data.total_processed}`)
    console.log(`   Message: ${result.message}`)

    if (result.data.errors && result.data.errors.length > 0) {
      console.log('\n⚠️ Errors:')
      result.data.errors.forEach((err: string) => console.log(`   - ${err}`))
    }
  } else {
    console.error('❌ Sync failed:', result.message)
    console.error('   Errors:', result.data?.errors)
  }
}

syncAll()
