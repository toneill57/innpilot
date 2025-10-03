/**
 * Check if Jammin' exists via API endpoint
 */

async function checkJammin() {
  const response = await fetch('http://localhost:3000/api/accommodation/units?tenant_id=b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf')
  const data = await response.json()

  console.log('API Response structure:', Object.keys(data))

  const units = Array.isArray(data) ? data : (data.data || data.units || [])

  console.log(`\n✅ Total units via API: ${units.length}`)
  console.log('\nAll accommodations:')
  units.forEach((u: any) => {
    console.log(`  - ${u.name} (MP: ${u.motopress_unit_id})`)
  })

  const jammin = units.find((u: any) => u.motopress_unit_id === 323)
  if (jammin) {
    console.log(`\n✅ Jammin' found!`)
    console.log(`   ID: ${jammin.id}`)
    console.log(`   Has description: ${!!jammin.description}`)
    console.log(`   Has embeddings: fast=${!!jammin.embedding_fast}, balanced=${!!jammin.embedding_balanced}`)
  } else {
    console.log(`\n❌ Jammin' NOT found`)
  }
}

checkJammin()
