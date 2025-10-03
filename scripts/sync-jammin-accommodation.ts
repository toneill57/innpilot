/**
 * Sync Jammin' (ID 323) from MotoPress with full data and embeddings
 */

async function syncJammin() {
  const response = await fetch('http://localhost:3000/api/integrations/motopress/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tenant_id: 'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf',
      selected_ids: [323]  // Jammin'
    })
  })

  const result = await response.json()

  if (result.success) {
    console.log('✅ Jammin\' synced successfully!')
    console.log(`   Created: ${result.data.created}`)
    console.log(`   Updated: ${result.data.updated}`)
    console.log(`   Message: ${result.message}`)
  } else {
    console.error('❌ Sync failed:', result.message)
    console.error('   Errors:', result.data?.errors)
  }
}

syncJammin()
