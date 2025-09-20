const fs = require('fs');
const path = require('path');

// Read CSV data - simplified structure based on the analysis
const businesses = [
  // I'll add the remaining businesses manually from the CSV
  {
    column: 10,
    category: 'Actividad',
    name: 'MARINO PARASAIL',
    zone: 'San Luis',
    subzone: 'Chameys',
    description: 'El parasail es una experiencia única que no te deberías perder, consiste en un vuelo elevado a 100 metros de altura, donde disfrutarán de una magnifica vista sobre la bahía, cada pasajero tendrá 15min de vuelo, para un máximo de dos horas de recorrido.',
    schedule: 'Tienen 5 salidas al día: 8:00, 9:00, 11:00, 14:00 y 16:00 h.',
    price: '$230,000 por persona',
    contact: 'Whatsapp: 3118837174',
    keywords: 'Parasail, actividades, aventura, vista al mar',
    segmentation: 'Low cost, mochilero, aventurero, eco friendly, soltero, negocios, lujo'
  },
  // Add more businesses here...
];

function createSlug(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

function getCategoryFolder(category) {
  const categoryMap = {
    'Actividad': 'actividad',
    'Restaurante': 'restaurante',
    'Spot': 'spot',
    'Night Life': 'night-life',
    'Alquiler': 'alquiler'
  };
  return categoryMap[category] || 'actividad';
}

function generateMarkdown(business) {
  return `# ${business.name}

## Información General

**Categoría:** ${business.category}
**Zona:** ${business.zone}
**Subzona:** ${business.subzone || 'No especificado'}
**Segmentación:** ${business.segmentation}

## Descripción

${business.description}

## Horarios y Precios

**Horario:** ${business.schedule}
**Precio:** ${business.price}

${business.history ? `## Historia\n\n${business.history}\n` : ''}
${business.person ? `## Encargado\n\n${business.person}\n` : ''}
${business.extra ? `## Datos Adicionales\n\n${business.extra}\n` : ''}
${business.recommendations ? `## Recomendaciones\n\n${business.recommendations}\n` : ''}

## Información de Contacto

${business.contact || 'No especificado en los datos'}

## Palabras Clave

${business.keywords}

${business.tags ? `## Tags\n\n${business.tags}\n` : ''}
${business.commissions ? `## Comisiones\n\n${business.commissions}\n` : ''}

---

*Última actualización: Septiembre 2025*`;
}

// Generate files
businesses.forEach(business => {
  const categoryFolder = getCategoryFolder(business.category);
  const slug = createSlug(business.name);
  const filePath = path.join(__dirname, '..', '_assets', 'muva', 'listings', categoryFolder, `${slug}.md`);

  const markdown = generateMarkdown(business);

  fs.writeFileSync(filePath, markdown, 'utf8');
  console.log(`Created: ${filePath}`);
});

console.log('All business listings generated successfully!');