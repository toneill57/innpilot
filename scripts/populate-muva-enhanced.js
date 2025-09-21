#!/usr/bin/env node

/**
 * ENHANCED MUVA EMBEDDINGS PROCESSOR
 * Version 2.0 - Con chunking mejorado
 *
 * Características:
 * - Chunking inteligente que respeta límites de palabras
 * - Procesamiento optimizado para contenido turístico
 * - Validación YAML robusta
 * - Mejor preservación semántica
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

// Validar variables de entorno requeridas
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
  // Separadores en orden de prioridad
  separators: [
    '\n\n## ',     // Secciones principales
    '\n\n### ',    // Subsecciones
    '\n\n**',      // Negritas (inicio de párrafos importantes)
    '\n\n',        // Párrafos
    '. ',          // Oraciones
    ', ',          // Cláusulas
    ' '            // Palabras (último recurso)
  ]
};

/**
 * Chunking mejorado que respeta límites naturales del texto
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

      // Buscar el mejor separador dentro del rango aceptable
      const searchStart = Math.max(
        currentPosition + CHUNK_CONFIG.minChunkSize,
        currentPosition
      );
      const searchEnd = Math.min(
        currentPosition + CHUNK_CONFIG.maxChunkSize,
        text.length
      );

      for (const separator of CHUNK_CONFIG.separators) {
        const lastIndex = text.lastIndexOf(
          separator,
          searchEnd
        );

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
        // Si no hay buen punto de corte, al menos no cortar en medio de palabra
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
          chunk_size: chunkText.length,
          has_overlap: currentPosition > 0
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

    // Ajustar overlap para no cortar palabras
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

    // Validar que el archivo comience con frontmatter
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

    // Parsear YAML con manejo de errores mejorado
    let frontmatter;
    try {
      frontmatter = yaml.load(frontmatterRaw);
    } catch (yamlError) {
      console.error(chalk.yellow(`⚠️ YAML parse error in ${path.basename(filePath)}:`));
      console.error(chalk.yellow(`  ${yamlError.message}`));

      // Intentar arreglar errores comunes
      let fixedYaml = frontmatterRaw;

      // Arreglar comillas no cerradas
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
      business_type: metadata.business_type,
      location_zone: metadata.location?.zone,
      name: metadata.name
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

      embeddings.push({
        id: chunkId,
        content: chunk.content,
        embedding: embedding,
        metadata: {
          ...metadata,
          ...chunk.metadata,
          chunk_number: i + 1,
          total_chunks: chunks.length,
          processed_at: new Date().toISOString()
        }
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
    // Insertar en lotes para mejor performance
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
  console.log(chalk.cyan('\n🚀 MUVA Enhanced Embeddings Processor v2.0\n'));
  console.log(chalk.gray('Features: Smart chunking, YAML validation, semantic preservation\n'));

  // Verificar conexión a Supabase
  console.log(chalk.blue('🔗 Connecting to Supabase...'));
  const { count, error: countError } = await supabase
    .from('muva_embeddings')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error(chalk.red('❌ Cannot connect to Supabase:', countError.message));
    process.exit(1);
  }

  console.log(chalk.green(`✅ Connected! Current embeddings in DB: ${count || 0}\n`));

  // Preguntar si limpiar la tabla
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

  // Buscar recursivamente todos los archivos .md
  async function findMarkdownFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await findMarkdownFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.name.endsWith('.md')) {
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
    totalEmbeddings: 0
  };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await processFile(file);

    if (result.success) {
      results.successful.push(result);

      // Insertar embeddings en la base de datos
      try {
        const inserted = await insertEmbeddings(result.embeddings);
        results.totalEmbeddings += inserted;
        console.log(chalk.green(`  ✅ Inserted ${inserted} embeddings to database`));
      } catch (error) {
        console.error(chalk.red(`  ❌ Failed to insert embeddings: ${error.message}`));
        results.failed.push({
          fileName: result.fileName,
          error: `Database insertion failed: ${error.message}`
        });
      }
    } else {
      results.failed.push(result);
    }

    // Mostrar progreso general
    console.log(chalk.gray(`\nProgress: ${i + 1}/${files.length} files processed`));
  }

  // Resumen final
  console.log(chalk.cyan('\n' + '='.repeat(60)));
  console.log(chalk.cyan('📊 PROCESSING COMPLETE'));
  console.log(chalk.cyan('='.repeat(60) + '\n'));

  console.log(chalk.green(`✅ Successful: ${results.successful.length} files`));
  console.log(chalk.green(`📦 Total embeddings created: ${results.totalEmbeddings}`));

  if (results.successful.length > 0) {
    const avgChunks = Math.round(
      results.successful.reduce((sum, r) => sum + r.stats.chunks, 0) /
      results.successful.length
    );
    const avgChunkSize = Math.round(
      results.successful.reduce((sum, r) => sum + r.stats.avgChunkSize, 0) /
      results.successful.length
    );

    console.log(chalk.blue(`📈 Avg chunks per file: ${avgChunks}`));
    console.log(chalk.blue(`📏 Avg chunk size: ${avgChunkSize} chars`));
  }

  if (results.failed.length > 0) {
    console.log(chalk.red(`\n❌ Failed: ${results.failed.length} files`));
    results.failed.forEach(f => {
      console.log(chalk.red(`  - ${f.fileName}: ${f.error}`));
    });
  }

  // Verificar resultado final en BD
  console.log(chalk.cyan('\n🔍 Verifying database...'));
  const { count: finalCount } = await supabase
    .from('muva_embeddings')
    .select('*', { count: 'exact', head: true });

  console.log(chalk.green(`✅ Total embeddings in database: ${finalCount}`));

  // Calcular tasa de éxito
  const successRate = ((results.successful.length / files.length) * 100).toFixed(1);

  if (successRate === '100.0') {
    console.log(chalk.green.bold(`\n🎉 PERFECT! 100% success rate!`));
  } else {
    console.log(chalk.yellow(`\n📊 Success rate: ${successRate}%`));
  }

  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Ejecutar
main().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:', error.message));
  process.exit(1);
});