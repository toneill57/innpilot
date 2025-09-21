#!/usr/bin/env node

/**
 * MUVA EMBEDDINGS PROCESSOR - PRODUCTION VERSION
 * Cumple con todos los constraints de la base de datos
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
config({ path: path.join(__dirname, '..', '.env.local') });

// Validar variables de entorno
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY'
];

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(chalk.red(`❌ Error: ${varName} not found in environment`));
    process.exit(1);
  }
}

// Inicializar clientes
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Mapeo de categorías a valores permitidos
const CATEGORY_MAPPING = {
  'Restaurante': 'restaurant',
  'Actividad': 'activity',
  'Spot': 'attraction',
  'Alquiler': 'shopping',
  'Night Life': 'nightlife',
  'Bar': 'nightlife',
  'Playa': 'beach',
  'Hotel': 'hotel',
  'Transporte': 'transport',
  'Cultura': 'culture',
  'Naturaleza': 'nature',
  'Aventura': 'adventure',
  'Guía': 'guide'
};

// Configuración de chunking mejorada
const CHUNK_CONFIG = {
  chunkSize: 1000,
  chunkOverlap: 150,
  minChunkSize: 300,
  maxChunkSize: 1200,
  separators: [
    '\n\n## ',     // Secciones principales
    '\n\n### ',    // Subsecciones
    '\n\n**',      // Negritas
    '\n\n',        // Párrafos
    '. ',          // Oraciones
    ', ',          // Cláusulas
    ' '            // Palabras (último recurso)
  ]
};

/**
 * Convertir precio a formato de símbolos de dólar
 */
function normalizePriceRange(priceText) {
  if (!priceText) return null;

  // Limpiar el texto
  const cleanPrice = priceText.replace(/[*\s]/g, '');

  // Buscar números
  const numbers = cleanPrice.match(/\d+/g);
  if (!numbers) return null;

  // Obtener el precio más alto mencionado
  const maxPrice = Math.max(...numbers.map(n => parseInt(n)));

  // Mapear a símbolos de dólar según rangos típicos para San Andrés
  if (maxPrice <= 20000) return '$';        // Económico
  if (maxPrice <= 50000) return '$$';       // Medio
  if (maxPrice <= 100000) return '$$$';     // Alto
  return '$$$$';                            // Lujo

  // Si no se puede determinar, usar valor medio por defecto
  return '$$';
}

/**
 * Chunking mejorado que respeta límites naturales
 */
function createSmartChunks(text, metadata = {}) {
  const chunks = [];
  let currentPosition = 0;

  while (currentPosition < text.length) {
    let chunkEnd = Math.min(
      currentPosition + CHUNK_CONFIG.chunkSize,
      text.length
    );

    // Si no estamos al final, buscar el mejor punto de corte
    if (chunkEnd < text.length) {
      let bestSplit = -1;
      let bestSeparator = null;

      const searchStart = Math.max(
        currentPosition + CHUNK_CONFIG.minChunkSize,
        currentPosition
      );
      const searchEnd = Math.min(
        currentPosition + CHUNK_CONFIG.maxChunkSize,
        text.length
      );

      for (const separator of CHUNK_CONFIG.separators) {
        const lastIndex = text.lastIndexOf(separator, searchEnd);

        if (lastIndex > searchStart && lastIndex > bestSplit) {
          bestSplit = lastIndex;
          bestSeparator = separator;
          // Si encontramos un separador de alta prioridad, usarlo
          if (separator.includes('##') || separator.includes('\n\n')) {
            break;
          }
        }
      }

      // Usar el mejor punto de corte encontrado
      if (bestSplit > currentPosition) {
        chunkEnd = bestSplit + (bestSeparator?.length || 0);
      } else {
        // Si no hay buen punto de corte, no cortar en medio de palabra
        while (chunkEnd > currentPosition &&
               chunkEnd < text.length &&
               text[chunkEnd] &&
               text[chunkEnd].match(/\w/)) {
          chunkEnd--;
        }
      }
    }

    // Extraer el chunk
    const chunkText = text.slice(currentPosition, chunkEnd).trim();

    if (chunkText.length >= 50) {
      chunks.push({
        content: chunkText,
        metadata: {
          ...metadata,
          chunk_index: chunks.length,
          chunk_size: chunkText.length
        }
      });
    }

    // Mover posición con overlap
    if (chunkEnd >= text.length) {
      break;
    }

    let overlapStart = Math.max(
      chunkEnd - CHUNK_CONFIG.chunkOverlap,
      currentPosition + CHUNK_CONFIG.minChunkSize
    );

    // No cortar palabras en el overlap
    while (overlapStart < chunkEnd &&
           text[overlapStart] &&
           text[overlapStart].match(/\w/)) {
      overlapStart++;
    }

    currentPosition = overlapStart;
  }

  return chunks;
}

/**
 * Parsear archivo Markdown con frontmatter YAML
 */
async function parseMarkdownFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');

    if (!content.startsWith('---')) {
      throw new Error('File does not have frontmatter');
    }

    const parts = content.split(/^---$/m);
    if (parts.length < 3) {
      throw new Error('Invalid frontmatter format');
    }

    const frontmatterRaw = parts[1];
    const markdownContent = parts.slice(2).join('---').trim();

    let frontmatter;
    try {
      frontmatter = yaml.load(frontmatterRaw);
    } catch (yamlError) {
      console.error(chalk.yellow(`⚠️ YAML error in ${path.basename(filePath)}: ${yamlError.message}`));

      // Intentar arreglar errores comunes
      let fixedYaml = frontmatterRaw;
      fixedYaml = fixedYaml.replace(/: "([^"\n]*)$/gm, ': "$1"');

      try {
        frontmatter = yaml.load(fixedYaml);
        console.log(chalk.green(`  ✅ Auto-fixed YAML issues`));
      } catch (secondError) {
        throw new Error(`YAML parse failed: ${yamlError.message}`);
      }
    }

    if (!frontmatter.name || !frontmatter.document_type) {
      throw new Error('Missing required fields: name or document_type');
    }

    if (frontmatter.document_type !== 'muva') {
      console.log(chalk.yellow(`⚠️ Correcting document_type from '${frontmatter.document_type}' to 'muva'`));
      frontmatter.document_type = 'muva';
    }

    return {
      metadata: frontmatter,
      content: markdownContent,
      fullContent: `# ${frontmatter.name}\n\n${markdownContent}`
    };

  } catch (error) {
    console.error(chalk.red(`❌ Error parsing ${path.basename(filePath)}: ${error.message}`));
    throw error;
  }
}

/**
 * Generar embedding usando OpenAI
 */
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error(chalk.red('❌ Error generating embedding:', error.message));
    throw error;
  }
}

/**
 * Mapear metadata a columnas de la BD
 */
function mapMetadataToColumns(metadata, chunk, fileName) {
  // Extraer información básica
  const businessName = metadata.name || 'Unknown';
  const businessType = metadata.business_type || 'Spot';
  const zone = metadata.location?.zone || 'San Andrés';

  // Mapear categoría basándose en el directorio
  let category = CATEGORY_MAPPING[businessType] || 'attraction';

  const dirPath = path.dirname(fileName);
  if (dirPath.includes('actividad')) {
    category = 'activity';
  } else if (dirPath.includes('restaurante')) {
    category = 'restaurant';
  } else if (dirPath.includes('night-life')) {
    category = 'nightlife';
  } else if (dirPath.includes('alquiler')) {
    category = 'shopping';
  } else if (dirPath.includes('spot')) {
    category = 'attraction';
  }

  // Crear descripción limpia
  let description = metadata.description || '';
  if (!description ||
      description.includes('[') ||
      description.includes('es seguro') ||
      description.includes('las cuales') ||
      description.includes('únicamente')) {
    // Usar primeras líneas del contenido como descripción
    description = chunk.content
      .substring(0, 200)
      .replace(/^#.*\n/, '') // Remover títulos
      .replace(/\n/g, ' ')
      .replace(/\*\*/g, '')
      .trim();

    if (chunk.content.length > 200) {
      description += '...';
    }
  }

  // Limpiar y preparar tags
  let tags = [];
  if (metadata.tags && Array.isArray(metadata.tags)) {
    tags = metadata.tags.filter(t => t && !t.includes('tag'));
  }
  if (metadata.keywords && Array.isArray(metadata.keywords)) {
    const keywords = metadata.keywords.filter(k => k && !k.includes('keyword'));
    tags = [...tags, ...keywords];
  }

  // Agregar tags relevantes
  tags.push(businessType.toLowerCase());
  tags.push(zone.toLowerCase());
  tags.push(category);

  // Eliminar duplicados y valores vacíos
  tags = [...new Set(tags)].filter(t => t && t.length > 0);

  // Información de contacto (solo si es válida)
  const contactInfo = {};
  if (metadata.contact) {
    const contact = metadata.contact;
    if (contact.whatsapp && !contact.whatsapp.includes('[')) {
      contactInfo.whatsapp = contact.whatsapp;
    }
    if (contact.email && !contact.email.includes('[') && contact.email.includes('@')) {
      contactInfo.email = contact.email;
    }
    if (contact.instagram && !contact.instagram.includes('[')) {
      contactInfo.instagram = contact.instagram;
    }
    if (contact.website && !contact.website.includes('[')) {
      contactInfo.website = contact.website;
    }
  }

  // Horarios (limpiar y validar)
  let openingHours = null;
  if (metadata.business_hours?.schedule) {
    const schedule = metadata.business_hours.schedule;
    if (!schedule.includes('[') && schedule.length > 3) {
      openingHours = schedule;
    }
  }

  // Precio (normalizar a formato $)
  let priceRange = null;
  if (metadata.pricing?.range) {
    priceRange = normalizePriceRange(metadata.pricing.range);
  }

  // Si no hay precio pero el contenido lo menciona, intentar extraerlo
  if (!priceRange && chunk.content.match(/\$\d+|\d+[,.]?\d*\s*(pesos|COP|cop)/i)) {
    const priceMatch = chunk.content.match(/\$?(\d+[,.]?\d*)/g);
    if (priceMatch) {
      const prices = priceMatch.map(p => parseInt(p.replace(/[\$,\.]/g, '')));
      const maxPrice = Math.max(...prices);
      priceRange = normalizePriceRange(maxPrice.toString());
    }
  }

  return {
    title: businessName,
    description: description,
    category: category,
    location: zone,
    city: 'San Andrés',
    rating: null,
    price_range: priceRange, // Puede ser null, que es permitido
    source_file: path.basename(fileName),
    chunk_index: chunk.metadata.chunk_index,
    total_chunks: chunk.metadata.total_chunks || 1,
    opening_hours: openingHours,
    contact_info: Object.keys(contactInfo).length > 0 ? contactInfo : null,
    tags: tags,
    language: 'es',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Procesar un archivo individual
 */
async function processFile(filePath) {
  const fileName = path.basename(filePath);
  console.log(chalk.blue(`\n📄 Processing: ${fileName}`));

  try {
    // Parsear archivo
    const { metadata, content, fullContent } = await parseMarkdownFile(filePath);
    console.log(chalk.gray(`  ✓ Parsed YAML frontmatter`));

    // Crear chunks inteligentes
    const chunks = createSmartChunks(fullContent, {
      file_name: fileName,
      total_chunks: 0
    });

    chunks.forEach(chunk => {
      chunk.metadata.total_chunks = chunks.length;
    });

    console.log(chalk.gray(`  ✓ Created ${chunks.length} smart chunks`));

    // Generar embeddings para cada chunk
    const embeddings = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Generar ID único
      const chunkId = `${fileName.replace('.md', '')}_chunk_${i}`;

      // Generar embedding
      const embedding = await generateEmbedding(chunk.content);

      // Mapear metadata a columnas
      const columnData = mapMetadataToColumns(metadata, chunk, filePath);

      embeddings.push({
        id: chunkId,
        content: chunk.content,
        embedding: embedding,
        ...columnData
      });

      // Mostrar progreso
      if ((i + 1) % 5 === 0 || i === chunks.length - 1) {
        console.log(chalk.gray(`  ✓ Generated embeddings: ${i + 1}/${chunks.length}`));
      }
    }

    return {
      success: true,
      fileName,
      embeddings,
      stats: {
        chunks: chunks.length,
        avgChunkSize: Math.round(
          chunks.reduce((sum, c) => sum + c.content.length, 0) / chunks.length
        ),
        category: embeddings[0]?.category,
        priceRange: embeddings[0]?.price_range
      }
    };

  } catch (error) {
    return {
      success: false,
      fileName,
      error: error.message
    };
  }
}

/**
 * Insertar embeddings en Supabase
 */
async function insertEmbeddings(embeddings) {
  try {
    const batchSize = 10;
    let inserted = 0;

    for (let i = 0; i < embeddings.length; i += batchSize) {
      const batch = embeddings.slice(i, i + batchSize);

      const { error } = await supabase
        .from('muva_embeddings')
        .upsert(batch, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (error) {
        throw error;
      }

      inserted += batch.length;
    }

    return inserted;
  } catch (error) {
    console.error(chalk.red('❌ Database error:', error.message));
    throw error;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log(chalk.cyan.bold('\n🚀 MUVA Embeddings Processor - Production Ready\n'));
  console.log(chalk.gray('Features: Full constraint compliance, smart chunking, quality validation\n'));

  // Verificar conexión
  console.log(chalk.blue('🔗 Connecting to Supabase...'));
  const { count, error: countError } = await supabase
    .from('muva_embeddings')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error(chalk.red('❌ Cannot connect to Supabase:', countError.message));
    process.exit(1);
  }

  console.log(chalk.green(`✅ Connected! Current embeddings: ${count || 0}\n`));

  // Limpiar tabla si tiene datos
  if (count > 0) {
    console.log(chalk.yellow(`⚠️  Found ${count} existing embeddings.`));
    console.log(chalk.cyan('🧹 Cleaning database for fresh start...'));

    const { error: deleteError } = await supabase
      .from('muva_embeddings')
      .delete()
      .neq('id', '');

    if (deleteError) {
      console.error(chalk.red('❌ Error cleaning database:', deleteError.message));
      process.exit(1);
    }

    console.log(chalk.green('✅ Database cleaned!\n'));
  }

  // Encontrar archivos MUVA
  const baseDir = path.join(__dirname, '..', '_assets', 'muva', 'listings');
  console.log(chalk.blue(`📁 Scanning directory: ${baseDir}\n`));

  // Buscar recursivamente archivos .md (excluyendo copias)
  async function findMarkdownFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await findMarkdownFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.name.endsWith('.md') && !entry.name.includes('copy')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  const files = await findMarkdownFiles(baseDir);
  console.log(chalk.cyan(`📊 Found ${files.length} Markdown files to process\n`));

  if (files.length === 0) {
    console.log(chalk.yellow('⚠️ No files found to process'));
    process.exit(0);
  }

  // Procesar archivos
  const results = {
    successful: [],
    failed: [],
    totalEmbeddings: 0,
    categoriesUsed: new Set(),
    priceRangesUsed: new Set()
  };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await processFile(file);

    if (result.success) {
      results.successful.push(result);

      if (result.stats.category) {
        results.categoriesUsed.add(result.stats.category);
      }
      if (result.stats.priceRange) {
        results.priceRangesUsed.add(result.stats.priceRange);
      }

      // Insertar embeddings
      try {
        const inserted = await insertEmbeddings(result.embeddings);
        results.totalEmbeddings += inserted;

        const details = [];
        if (result.stats.category) details.push(`cat: ${result.stats.category}`);
        if (result.stats.priceRange) details.push(`price: ${result.stats.priceRange}`);

        console.log(chalk.green(`  ✅ Inserted ${inserted} embeddings${details.length > 0 ? ` (${details.join(', ')})` : ''}`));
      } catch (error) {
        console.error(chalk.red(`  ❌ Failed to insert: ${error.message}`));
        results.failed.push({
          fileName: result.fileName,
          error: `Database: ${error.message}`
        });
      }
    } else {
      results.failed.push(result);
    }

    console.log(chalk.gray(`\nProgress: ${i + 1}/${files.length} files processed`));
  }

  // Resumen final
  console.log(chalk.cyan('\n' + '='.repeat(60)));
  console.log(chalk.cyan.bold('📊 PROCESSING COMPLETE'));
  console.log(chalk.cyan('='.repeat(60) + '\n'));

  console.log(chalk.green(`✅ Successfully processed: ${results.successful.length}/${files.length} files`));
  console.log(chalk.green(`📦 Total embeddings created: ${results.totalEmbeddings}`));
  console.log(chalk.blue(`📂 Categories used: ${[...results.categoriesUsed].sort().join(', ')}`));
  console.log(chalk.blue(`💰 Price ranges: ${[...results.priceRangesUsed].sort().join(', ')}`));

  if (results.successful.length > 0) {
    const avgChunks = Math.round(
      results.successful.reduce((sum, r) => sum + r.stats.chunks, 0) /
      results.successful.length
    );
    const avgChunkSize = Math.round(
      results.successful.reduce((sum, r) => sum + r.stats.avgChunkSize, 0) /
      results.successful.length
    );

    console.log(chalk.blue(`📈 Average chunks per file: ${avgChunks}`));
    console.log(chalk.blue(`📏 Average chunk size: ${avgChunkSize} chars`));
  }

  if (results.failed.length > 0) {
    console.log(chalk.red(`\n❌ Failed: ${results.failed.length} files`));
    results.failed.forEach(f => {
      console.log(chalk.red(`  - ${f.fileName}: ${f.error}`));
    });
  }

  // Verificar resultado final en BD
  console.log(chalk.cyan('\n🔍 Final database verification...'));
  const { count: finalCount } = await supabase
    .from('muva_embeddings')
    .select('*', { count: 'exact', head: true });

  console.log(chalk.green(`✅ Total embeddings in database: ${finalCount}`));

  // Verificar calidad de chunking con muestras
  console.log(chalk.cyan('\n📝 Chunking quality check...'));
  const { data: samples } = await supabase
    .from('muva_embeddings')
    .select('id, title, category, price_range, content')
    .limit(5);

  if (samples && samples.length > 0) {
    console.log(chalk.gray('\nSample chunks for quality verification:'));

    let wordCuts = 0;
    samples.forEach((sample, idx) => {
      const preview = sample.content.substring(0, 100);
      const hasWordCut = preview.match(/\w$/) && sample.content[100]?.match(/\w/);

      if (hasWordCut) wordCuts++;

      const quality = hasWordCut ? '⚠️' : '✅';

      console.log(chalk.gray(`\n  ${idx + 1}. ${quality} [${sample.category}] ${sample.title} ${sample.price_range || '(no price)'}`));
      console.log(chalk.gray(`     "${preview}..."`));
    });

    if (wordCuts === 0) {
      console.log(chalk.green.bold('\n✨ EXCELLENT! No word cuts detected in sample chunks!'));
    } else {
      console.log(chalk.yellow(`\n⚠️ Found ${wordCuts} potential word cuts in ${samples.length} samples`));
    }
  }

  // Calcular tasa de éxito
  const successRate = ((results.successful.length / files.length) * 100).toFixed(1);

  if (successRate === '100.0') {
    console.log(chalk.green.bold(`\n🎉 PERFECT! 100% success rate!`));
    console.log(chalk.green('All MUVA tourism data has been successfully embedded!'));
  } else {
    console.log(chalk.yellow(`\n📊 Success rate: ${successRate}%`));
  }

  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Ejecutar
main().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:', error.message));
  console.error(error.stack);
  process.exit(1);
});