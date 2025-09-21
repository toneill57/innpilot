#!/usr/bin/env node

/**
 * Script para procesar archivos .md de MUVA listings y generar embeddings
 * Procesa directamente desde /Users/oneill/Sites/apps/InnPilot/_assets/muva/listings/
 */

const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const matter = require('gray-matter');
const crypto = require('crypto');

// Configuración
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ooaumjzaztmutltifhoq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const LISTINGS_DIR = '/Users/oneill/Sites/apps/InnPilot/_assets/muva/listings';

// Inicializar clientes
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Configuración de chunking
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 100;

// Estadísticas
const stats = {
  totalFiles: 0,
  processedFiles: 0,
  totalChunks: 0,
  errors: [],
  startTime: Date.now()
};

/**
 * Genera un ID único para MUVA
 */
function generateMuvaId(name, businessType) {
  const cleanName = name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const cleanType = businessType.toLowerCase();
  const hash = crypto.createHash('md5').update(`${cleanName}-${cleanType}`).digest('hex').substring(0, 6);
  return `muva_${cleanType}_${cleanName}_${hash}`;
}

/**
 * Crea chunks de texto con validación semántica
 */
function createChunks(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  let currentChunk = '';
  let currentLength = 0;

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    const sentenceLength = trimmedSentence.length;

    if (currentLength + sentenceLength <= chunkSize) {
      currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
      currentLength += sentenceLength;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }

      // Crear overlap con las últimas oraciones del chunk anterior
      if (chunks.length > 0 && overlap > 0) {
        const overlapText = currentChunk.substring(Math.max(0, currentChunk.length - overlap));
        currentChunk = overlapText + ' ' + trimmedSentence;
        currentLength = currentChunk.length;
      } else {
        currentChunk = trimmedSentence;
        currentLength = sentenceLength;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Genera embeddings usando OpenAI
 */
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generando embedding:', error.message);
    throw error;
  }
}

/**
 * Procesa un archivo .md individual
 */
async function processFile(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n📄 Procesando: ${fileName}`);

  try {
    // Leer y parsear archivo
    const content = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content: mainContent } = matter(content);

    // Validar document_type
    if (frontmatter.document_type !== 'muva') {
      console.log(`  ⚠️  Saltando - No es tipo MUVA: ${fileName}`);
      return;
    }

    // Extraer metadata
    const metadata = {
      name: frontmatter.name || 'Sin nombre',
      business_type: frontmatter.business_type || 'General',
      location: frontmatter.location || {},
      tags: frontmatter.tags || [],
      keywords: frontmatter.keywords || [],
      pricing: frontmatter.pricing || {},
      contact: frontmatter.contact || {},
      search_terms: frontmatter.search_terms || '',
      status: frontmatter.status || 'active',
      rating: frontmatter.rating || 0,
      target_audience: frontmatter.target_audience || []
    };

    // Generar ID único
    const documentId = generateMuvaId(metadata.name, metadata.business_type);

    // Crear contenido completo para chunking
    const fullContent = `
${metadata.name}
${metadata.business_type}
${metadata.location.zone || ''} ${metadata.location.zone_description || ''}
${metadata.search_terms}
${mainContent}
    `.trim();

    // Crear chunks
    const chunks = createChunks(fullContent);
    console.log(`  📊 Chunks creados: ${chunks.length}`);

    // Eliminar embeddings existentes para este documento
    const { error: deleteError } = await supabase
      .from('muva_embeddings')
      .delete()
      .eq('document_id', documentId);

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.error(`  ❌ Error eliminando embeddings antiguos:`, deleteError);
    }

    // Procesar cada chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`  🔄 Procesando chunk ${i + 1}/${chunks.length}`);

      // Generar embedding
      const embedding = await generateEmbedding(chunk);

      // Preparar datos para insertar
      const embeddingData = {
        id: `${documentId}_chunk_${i}`,
        document_id: documentId,
        content: chunk,
        embedding: embedding,
        metadata: {
          ...metadata,
          chunk_index: i,
          total_chunks: chunks.length,
          source_file: fileName,
          processed_at: new Date().toISOString()
        }
      };

      // Insertar en Supabase
      const { error: insertError } = await supabase
        .from('muva_embeddings')
        .insert(embeddingData);

      if (insertError) {
        console.error(`  ❌ Error insertando chunk ${i}:`, insertError);
        stats.errors.push({ file: fileName, chunk: i, error: insertError.message });
      } else {
        stats.totalChunks++;
      }

      // Pequeña pausa para no sobrecargar la API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    stats.processedFiles++;
    console.log(`  ✅ Archivo procesado exitosamente`);

  } catch (error) {
    console.error(`  ❌ Error procesando ${fileName}:`, error.message);
    stats.errors.push({ file: fileName, error: error.message });
  }
}

/**
 * Obtiene todos los archivos .md de una carpeta
 */
async function getMdFiles(dir) {
  const files = [];
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      // Recursivamente buscar en subdirectorios
      const subFiles = await getMdFiles(fullPath);
      files.push(...subFiles);
    } else if (item.isFile() && item.name.endsWith('.md')) {
      // Filtrar archivos .bak y copy
      if (!item.name.includes('.bak') && !item.name.includes('copy')) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 PROCESADOR DE EMBEDDINGS MUVA - LISTINGS');
  console.log('=' .repeat(50));
  console.log(`📁 Directorio: ${LISTINGS_DIR}`);
  console.log(`🔧 Chunking: ${CHUNK_SIZE} chars, ${CHUNK_OVERLAP} overlap`);
  console.log('=' .repeat(50));

  try {
    // Obtener todos los archivos .md
    console.log('\n📂 Escaneando archivos...');
    const mdFiles = await getMdFiles(LISTINGS_DIR);
    stats.totalFiles = mdFiles.length;

    console.log(`📊 Archivos encontrados: ${stats.totalFiles}`);
    console.log('\n🔄 Iniciando procesamiento...\n');

    // Procesar cada archivo
    for (const filePath of mdFiles) {
      await processFile(filePath);
    }

    // Reporte final
    const elapsedTime = ((Date.now() - stats.startTime) / 1000).toFixed(2);

    console.log('\n' + '=' .repeat(50));
    console.log('📈 REPORTE FINAL');
    console.log('=' .repeat(50));
    console.log(`✅ Archivos procesados: ${stats.processedFiles}/${stats.totalFiles}`);
    console.log(`📦 Total chunks generados: ${stats.totalChunks}`);
    console.log(`⏱️  Tiempo total: ${elapsedTime} segundos`);

    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errores encontrados: ${stats.errors.length}`);
      stats.errors.forEach(err => {
        console.log(`  - ${err.file}: ${err.error}`);
      });
    } else {
      console.log('\n🎉 Procesamiento completado sin errores!');
    }

    // Verificar en base de datos
    console.log('\n🔍 Verificando en base de datos...');
    const { data, count } = await supabase
      .from('muva_embeddings')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total embeddings en muva_embeddings: ${count}`);

  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
  }
}

// Verificar variables de entorno
if (!SUPABASE_KEY || !OPENAI_API_KEY) {
  console.error('❌ Error: Variables de entorno requeridas no configuradas');
  console.error('   Necesitas: SUPABASE_SERVICE_ROLE_KEY y OPENAI_API_KEY');
  process.exit(1);
}

// Ejecutar
main().catch(console.error);