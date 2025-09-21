#!/usr/bin/env node

/**
 * MUVA EMBEDDINGS PROCESSOR - FIXED VERSION
 * Compatible con la estructura actual de muva_embeddings
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

      // Buscar el mejor separador
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

    if (chunkText.length >= 50) { // Ignorar chunks muy pequeños
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

    // Aplicar overlap inteligente
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

    // Validar frontmatter
    if (!content.startsWith('---')) {
      throw new Error('File does not have frontmatter');
    }

    // Extraer frontmatter y contenido
    const parts = content.split(/^---$/m);
    if (parts.length < 3) {
      throw new Error('Invalid frontmatter format');
    }

    const frontmatterRaw = parts[1];
    const markdownContent = parts.slice(2).join('---').trim();

    // Parsear YAML
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

    // Validar campos requeridos
    if (!frontmatter.name || !frontmatter.document_type) {
      throw new Error('Missing required fields: name or document_type');
    }

    // Asegurar que document_type sea 'muva'
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
  // Extraer información del negocio
  const businessName = metadata.name || 'Unknown';
  const businessType = metadata.business_type || 'Spot';
  const zone = metadata.location?.zone || 'San Andrés';

  // Crear descripción desde el contenido si no existe
  let description = metadata.description || '';
  if (!description || description.includes('[') || description.includes('es seguro')) {
    // Usar las primeras 200 caracteres del contenido como descripción
    description = chunk.content.substring(0, 200).replace(/\n/g, ' ').trim();
    if (chunk.content.length > 200) {
      description += '...';
    }
  }

  // Extraer tags y keywords
  let tags = [];
  if (metadata.tags && Array.isArray(metadata.tags)) {
    tags = metadata.tags.filter(t => !t.includes('tag'));
  }
  if (metadata.keywords && Array.isArray(metadata.keywords)) {
    tags = [...tags, ...metadata.keywords.filter(k => !k.includes('keyword'))];
  }
  if (tags.length === 0) {
    // Agregar tags basados en el tipo de negocio
    tags = [businessType.toLowerCase(), zone.toLowerCase()];
  }

  // Información de contacto
  const contactInfo = {};
  if (metadata.contact) {
    if (metadata.contact.whatsapp) contactInfo.whatsapp = metadata.contact.whatsapp;
    if (metadata.contact.email) contactInfo.email = metadata.contact.email;
    if (metadata.contact.instagram) contactInfo.instagram = metadata.contact.instagram;
    if (metadata.contact.website) contactInfo.website = metadata.contact.website;
  }

  // Horarios
  let openingHours = null;
  if (metadata.business_hours?.schedule) {
    openingHours = metadata.business_hours.schedule;
  }

  // Precio
  let priceRange = null;
  if (metadata.pricing?.range) {
    priceRange = metadata.pricing.range;
  }

  return {
    title: businessName,
    description: description,
    category: businessType,
    location: zone,
    city: 'San Andrés',
    rating: null, // Se puede agregar si existe en metadata
    price_range: priceRange,
    source_file: fileName,
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
      total_chunks: 0 // Se actualizará después
    });

    // Actualizar total de chunks
    chunks.forEach(chunk => {
      chunk.metadata.total_chunks = chunks.length;
    });

    console.log(chalk.gray(`  ✓ Created ${chunks.length} smart chunks`));

    // Generar embeddings para cada chunk
    const embeddings = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Generar ID único para el chunk
      const chunkId = `${fileName.replace('.md', '')}_chunk_${i}`;

      // Generar embedding
      const embedding = await generateEmbedding(chunk.content);

      // Mapear metadata a columnas de BD
      const columnData = mapMetadataToColumns(metadata, chunk, fileName);

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
        )
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
    // Insertar en lotes
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
  console.log(chalk.cyan('\n🚀 MUVA Embeddings Processor - Fixed Version\n'));

  // Verificar conexión a Supabase
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
    console.log(chalk.cyan('🧹 Cleaning database...'));

    const { error: deleteError } = await supabase
      .from('muva_embeddings')
      .delete()
      .neq('id', '');

    if (deleteError) {
      console.error(chalk.red('❌ Error cleaning:', deleteError.message));
      process.exit(1);
    }

    console.log(chalk.green('✅ Database cleaned!\n'));
  }

  // Encontrar archivos MUVA
  const baseDir = path.join(__dirname, '..', '_assets', 'muva', 'listings');
  console.log(chalk.blue(`📁 Scanning: ${baseDir}\n`));

  // Buscar recursivamente archivos .md (excluyendo "copy")
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
  console.log(chalk.cyan(`📊 Found ${files.length} files to process (excluding duplicates)\n`));

  if (files.length === 0) {
    console.log(chalk.yellow('⚠️ No files found'));
    process.exit(0);
  }

  // Procesar archivos
  const results = {
    successful: [],
    failed: [],
    totalEmbeddings: 0
  };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await processFile(file);

    if (result.success) {
      results.successful.push(result);

      // Insertar embeddings
      try {
        const inserted = await insertEmbeddings(result.embeddings);
        results.totalEmbeddings += inserted;
        console.log(chalk.green(`  ✅ Inserted ${inserted} embeddings`));
      } catch (error) {
        console.error(chalk.red(`  ❌ Failed to insert: ${error.message}`));
        results.failed.push({
          fileName: result.fileName,
          error: `Database insertion: ${error.message}`
        });
      }
    } else {
      results.failed.push(result);
    }

    console.log(chalk.gray(`\nProgress: ${i + 1}/${files.length} files\n`));
  }

  // Resumen final
  console.log(chalk.cyan('\n' + '='.repeat(60)));
  console.log(chalk.cyan('📊 PROCESSING COMPLETE'));
  console.log(chalk.cyan('='.repeat(60) + '\n'));

  console.log(chalk.green(`✅ Successful: ${results.successful.length} files`));
  console.log(chalk.green(`📦 Total embeddings: ${results.totalEmbeddings}`));

  if (results.successful.length > 0) {
    const avgChunks = Math.round(
      results.successful.reduce((sum, r) => sum + r.stats.chunks, 0) /
      results.successful.length
    );
    const avgChunkSize = Math.round(
      results.successful.reduce((sum, r) => sum + r.stats.avgChunkSize, 0) /
      results.successful.length
    );

    console.log(chalk.blue(`📈 Avg chunks/file: ${avgChunks}`));
    console.log(chalk.blue(`📏 Avg chunk size: ${avgChunkSize} chars`));
  }

  if (results.failed.length > 0) {
    console.log(chalk.red(`\n❌ Failed: ${results.failed.length} files`));
    results.failed.forEach(f => {
      console.log(chalk.red(`  - ${f.fileName}: ${f.error}`));
    });
  }

  // Verificar resultado final
  console.log(chalk.cyan('\n🔍 Verifying database...'));
  const { count: finalCount } = await supabase
    .from('muva_embeddings')
    .select('*', { count: 'exact', head: true });

  console.log(chalk.green(`✅ Total embeddings in DB: ${finalCount}`));

  // Calcular tasa de éxito
  const successRate = ((results.successful.length / files.length) * 100).toFixed(1);

  if (successRate === '100.0') {
    console.log(chalk.green.bold(`\n🎉 PERFECT! 100% success rate!`));
  } else {
    console.log(chalk.yellow(`\n📊 Success rate: ${successRate}%`));
  }

  // Mostrar algunos ejemplos de chunks para verificar calidad
  if (results.totalEmbeddings > 0) {
    console.log(chalk.cyan('\n📝 Sample chunks for quality check:'));

    const { data: samples } = await supabase
      .from('muva_embeddings')
      .select('id, title, content')
      .limit(3);

    if (samples) {
      samples.forEach(sample => {
        console.log(chalk.gray(`\n  [${sample.id}] ${sample.title}`));
        console.log(chalk.gray(`  "${sample.content.substring(0, 100)}..."`));
      });
    }
  }

  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Ejecutar
main().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:', error.message));
  process.exit(1);
});