import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
config({ path: '.env.local' })

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function chunkDocument(content) {
  const CHUNK_SIZE = 1000
  const OVERLAP = 100

  // Same splitter as original
  const separators = [
    '\n## ',    // Main sections
    '\n### ',   // Subsections
    '\n\n',     // Paragraphs
    '\n',       // Lines
    '. ',       // Sentences
    '? ',       // Questions
    '! ',       // Exclamations
    '; ',       // Semicolons
    ', ',       // Commas
    ' ',        // Spaces
    ''          // Characters (last resort)
  ]

  function recursiveSplit(text) {
    if (text.length <= CHUNK_SIZE) {
      return [text]
    }

    const chunks = []
    let start = 0

    while (start < text.length) {
      let end = start + CHUNK_SIZE

      if (end >= text.length) {
        chunks.push(text.substring(start))
        break
      }

      let splitPoint = -1

      for (const separator of separators) {
        if (separator === '') {
          splitPoint = end
          break
        }

        const lastIndex = text.lastIndexOf(separator, end)

        if (lastIndex > start + CHUNK_SIZE / 2) {
          splitPoint = lastIndex + separator.length
          break
        }
      }

      if (splitPoint === -1) {
        splitPoint = end
      }

      chunks.push(text.substring(start, splitPoint))
      start = Math.max(splitPoint - OVERLAP, start + 1)
    }

    return chunks
  }

  const chunks = recursiveSplit(content)
  return chunks.filter(chunk => chunk.trim().length >= 50)
}

function extractFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return { frontmatter: null, content }
  }

  const frontmatterText = match[1]
  const contentWithoutFrontmatter = content.replace(match[0], '').trim()

  // Parse YAML-like frontmatter
  const frontmatter = {}
  frontmatterText.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim()
      let value = line.substring(colonIndex + 1).trim()

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }

      frontmatter[key] = value
    }
  })

  return { frontmatter, content: contentWithoutFrontmatter }
}

async function testLongChunking() {
  console.log('🧪 Testing chunking with long document...')

  const filePath = '/tmp/embedding-tests/test5-long-document.md'
  const filename = path.basename(filePath)

  // Step 1: Read original content
  const rawContent = fs.readFileSync(filePath, 'utf-8')
  console.log('\n📄 ORIGINAL CONTENT LENGTH:', rawContent.length, 'characters')

  // Step 2: Extract frontmatter
  const { frontmatter, content } = extractFrontmatter(rawContent)
  console.log('📋 CONTENT AFTER FRONTMATTER LENGTH:', content.length, 'characters')

  // Step 3: Generate chunks
  const chunks = chunkDocument(content)
  console.log(`\n✂️ CHUNKS GENERATED: ${chunks.length} chunks`)

  chunks.forEach((chunk, i) => {
    console.log(`\n--- Chunk ${i + 1} (${chunk.length} chars) ---`)
    console.log('First 100 chars:', chunk.substring(0, 100))
    console.log('Last 100 chars:', '...' + chunk.substring(Math.max(0, chunk.length - 100)))

    // Check if chunk contains any problematic patterns
    if (chunk.includes('#')) {
      console.log('⚠️ Contains "#" character')
    }
    if (chunk.includes('untrusted-data')) {
      console.log('🚨 Contains "untrusted-data" - PROBLEM!')
    }

    console.log('--- End Chunk ---')
  })

  // Step 4: Analyze overlap
  console.log('\n🔄 OVERLAP ANALYSIS:')
  for (let i = 0; i < chunks.length - 1; i++) {
    const currentChunk = chunks[i]
    const nextChunk = chunks[i + 1]

    // Check if there's actual overlap
    const currentEnd = currentChunk.substring(Math.max(0, currentChunk.length - 200))
    const nextStart = nextChunk.substring(0, 200)

    // Find common text
    let commonText = ''
    for (let j = 1; j <= Math.min(currentEnd.length, nextStart.length); j++) {
      const suffix = currentEnd.substring(currentEnd.length - j)
      if (nextStart.startsWith(suffix)) {
        commonText = suffix
      }
    }

    console.log(`Chunk ${i + 1} → ${i + 2}: overlap = ${commonText.length} chars`)
    if (commonText.length > 0) {
      console.log(`  Overlap text: "${commonText.substring(0, 50)}${commonText.length > 50 ? '...' : ''}"`)
    }
  }

  console.log('\n✅ Long chunking test completed!')
}

testLongChunking()