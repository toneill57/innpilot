#!/usr/bin/env node

/**
 * Component Analysis Utility
 *
 * Herramienta especializada para analizar componentes React en el proyecto InnPilot.
 * Proporciona análisis detallado de patrones de diseño, accesibilidad y performance.
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.dirname(__dirname)

// Configuración del análisis
const ANALYSIS_CONFIG = {
  paths: {
    components: 'src/components',
    pages: 'src/app',
    styles: 'src/app/globals.css'
  },
  patterns: {
    component: /^[A-Z][a-zA-Z0-9]*\.tsx?$/,
    hook: /^use[A-Z][a-zA-Z0-9]*\.ts$/,
    utility: /^[a-z][a-zA-Z0-9]*\.ts$/
  },
  metrics: {
    complexity: {
      low: { lines: 50, components: 2, hooks: 3 },
      medium: { lines: 150, components: 5, hooks: 8 },
      high: { lines: 300, components: 10, hooks: 15 }
    },
    quality: {
      typescript: 1.0,
      proptypes: 0.8,
      accessibility: 1.2,
      responsive: 1.1,
      testing: 1.3
    }
  }
}

// Estado del análisis
let ANALYSIS_STATE = {
  totalFiles: 0,
  analyzedFiles: 0,
  errors: [],
  warnings: [],
  suggestions: []
}

const log = {
  info: (msg) => console.log(`🔍 ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  detail: (msg) => console.log(`   ${msg}`)
}

/**
 * Análisis principal de componentes
 */
async function analyzeComponents(options = {}) {
  log.info('Iniciando análisis de componentes...')

  const results = {
    timestamp: new Date().toISOString(),
    summary: {},
    components: {},
    patterns: {},
    quality: {},
    recommendations: []
  }

  try {
    // 1. Descubrir componentes
    const componentFiles = discoverComponents()
    results.summary.totalComponents = componentFiles.length
    ANALYSIS_STATE.totalFiles = componentFiles.length

    log.info(`Encontrados ${componentFiles.length} componentes para analizar`)

    // 2. Analizar cada componente
    for (const file of componentFiles) {
      try {
        const analysis = await analyzeComponent(file)
        results.components[file] = analysis
        ANALYSIS_STATE.analyzedFiles++
      } catch (error) {
        ANALYSIS_STATE.errors.push({ file, error: error.message })
        log.error(`Error analizando ${file}: ${error.message}`)
      }
    }

    // 3. Análisis de patrones globales
    results.patterns = analyzePatterns(results.components)

    // 4. Métricas de calidad
    results.quality = calculateQualityMetrics(results.components)

    // 5. Generar recomendaciones
    results.recommendations = generateRecommendations(results)

    // 6. Mostrar resumen
    displaySummary(results)

    return results

  } catch (error) {
    log.error(`Error en análisis: ${error.message}`)
    throw error
  }
}

/**
 * Descubrir todos los componentes en el proyecto
 */
function discoverComponents() {
  const componentFiles = []

  const searchPaths = [
    path.join(projectRoot, ANALYSIS_CONFIG.paths.components),
    path.join(projectRoot, ANALYSIS_CONFIG.paths.pages)
  ]

  searchPaths.forEach(searchPath => {
    if (fs.existsSync(searchPath)) {
      const files = findComponentFiles(searchPath)
      componentFiles.push(...files)
    }
  })

  return componentFiles.filter(file =>
    ANALYSIS_CONFIG.patterns.component.test(path.basename(file))
  )
}

/**
 * Buscar archivos de componentes recursivamente
 */
function findComponentFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      findComponentFiles(fullPath, files)
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      files.push(fullPath)
    }
  })

  return files
}

/**
 * Análisis detallado de un componente individual
 */
async function analyzeComponent(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const fileName = path.basename(filePath, path.extname(filePath))
  const relativePath = path.relative(projectRoot, filePath)

  const analysis = {
    name: fileName,
    path: relativePath,
    size: {
      bytes: content.length,
      lines: content.split('\n').length
    },
    structure: analyzeStructure(content),
    dependencies: analyzeDependencies(content),
    styling: analyzeStyling(content),
    accessibility: analyzeAccessibility(content),
    performance: analyzePerformance(content),
    patterns: analyzeComponentPatterns(content),
    quality: calculateComponentQuality(content),
    domain: detectComponentDomain(filePath, content)
  }

  return analysis
}

/**
 * Analizar estructura del componente
 */
function analyzeStructure(content) {
  const structure = {
    exports: [],
    components: [],
    hooks: [],
    interfaces: [],
    types: [],
    constants: []
  }

  // Detectar exports
  const exportMatches = content.match(/export\s+(default\s+)?(function|const|class|interface|type)\s+(\w+)/g) || []
  structure.exports = exportMatches.map(match => {
    const parts = match.match(/export\s+(default\s+)?(function|const|class|interface|type)\s+(\w+)/)
    return {
      name: parts[3],
      type: parts[2],
      isDefault: !!parts[1]
    }
  })

  // Detectar componentes
  const componentMatches = content.match(/(const|function)\s+([A-Z]\w*)\s*[:=]\s*(\([^)]*\))?\s*=>/g) || []
  structure.components = componentMatches.map(match => {
    const parts = match.match(/(const|function)\s+([A-Z]\w*)/)
    return parts[2]
  })

  // Detectar hooks
  const hookMatches = content.match(/use[A-Z]\w*\(/g) || []
  structure.hooks = [...new Set(hookMatches.map(hook => hook.slice(0, -1)))]

  // Detectar interfaces y types
  const interfaceMatches = content.match(/interface\s+(\w+)/g) || []
  structure.interfaces = interfaceMatches.map(match => match.split(' ')[1])

  const typeMatches = content.match(/type\s+(\w+)/g) || []
  structure.types = typeMatches.map(match => match.split(' ')[1])

  return structure
}

/**
 * Analizar dependencias
 */
function analyzeDependencies(content) {
  const dependencies = {
    react: [],
    external: [],
    internal: [],
    total: 0
  }

  const importMatches = content.match(/import\s+.*?from\s+['"`]([^'"`]+)['"`]/g) || []

  importMatches.forEach(importStatement => {
    const moduleName = importStatement.match(/from\s+['"`]([^'"`]+)['"`]/)[1]

    if (moduleName.startsWith('react')) {
      dependencies.react.push(moduleName)
    } else if (moduleName.startsWith('.') || moduleName.startsWith('@/')) {
      dependencies.internal.push(moduleName)
    } else {
      dependencies.external.push(moduleName)
    }
  })

  dependencies.total = dependencies.react.length + dependencies.external.length + dependencies.internal.length

  return dependencies
}

/**
 * Analizar estilos y clases CSS
 */
function analyzeStyling(content) {
  const styling = {
    tailwind: {
      classes: [],
      responsive: false,
      animations: false,
      customProperties: false
    },
    css: {
      modules: false,
      inline: false,
      customClasses: []
    },
    patterns: []
  }

  // Detectar clases Tailwind
  const classMatches = content.match(/className\s*=\s*['"`]([^'"`]*)['"`]/g) || []
  const allClasses = classMatches.join(' ').match(/\b[\w-]+(?::\w+)*\b/g) || []

  styling.tailwind.classes = [...new Set(allClasses.filter(cls =>
    cls.includes('-') || cls.match(/^(sm|md|lg|xl|2xl):/)))]

  // Detectar responsive
  styling.tailwind.responsive = /\b(sm|md|lg|xl|2xl):/.test(content)

  // Detectar animaciones
  styling.tailwind.animations = /\b(animate-|transition|duration|ease)/.test(content)

  // Detectar patrones de estilo comunes
  if (styling.tailwind.classes.some(cls => cls.includes('gradient'))) {
    styling.patterns.push('gradients')
  }
  if (styling.tailwind.classes.some(cls => cls.includes('shadow'))) {
    styling.patterns.push('shadows')
  }
  if (styling.tailwind.classes.some(cls => cls.includes('rounded'))) {
    styling.patterns.push('rounded-corners')
  }

  return styling
}

/**
 * Analizar accesibilidad
 */
function analyzeAccessibility(content) {
  const accessibility = {
    score: 0,
    features: [],
    missing: [],
    ariaLabels: 0,
    semanticElements: 0,
    keyboardSupport: false
  }

  // Detectar características de accesibilidad
  if (content.includes('aria-')) {
    accessibility.features.push('aria-labels')
    accessibility.ariaLabels = (content.match(/aria-\w+/g) || []).length
  }

  if (content.includes('role=')) {
    accessibility.features.push('roles')
  }

  if (content.includes('tabIndex') || content.includes('onKeyDown')) {
    accessibility.features.push('keyboard-navigation')
    accessibility.keyboardSupport = true
  }

  // Detectar elementos semánticos
  const semanticTags = ['button', 'nav', 'main', 'aside', 'article', 'section', 'header', 'footer']
  accessibility.semanticElements = semanticTags.filter(tag =>
    content.includes(`<${tag}`) || content.includes(`'${tag}'`)).length

  // Calcular score
  accessibility.score = Math.min(100,
    (accessibility.ariaLabels * 10) +
    (accessibility.semanticElements * 15) +
    (accessibility.keyboardSupport ? 30 : 0) +
    (accessibility.features.length * 10)
  )

  // Identificar mejoras faltantes
  if (accessibility.ariaLabels === 0) accessibility.missing.push('aria-labels')
  if (!accessibility.keyboardSupport) accessibility.missing.push('keyboard-navigation')
  if (accessibility.semanticElements === 0) accessibility.missing.push('semantic-elements')

  return accessibility
}

/**
 * Analizar performance
 */
function analyzePerformance(content) {
  const performance = {
    score: 100,
    optimizations: [],
    concerns: [],
    metrics: {}
  }

  // Detectar optimizaciones
  if (content.includes('React.memo') || content.includes('memo(')) {
    performance.optimizations.push('memoization')
  }

  if (content.includes('useCallback') || content.includes('useMemo')) {
    performance.optimizations.push('hooks-optimization')
  }

  if (content.includes('lazy') || content.includes('Suspense')) {
    performance.optimizations.push('code-splitting')
  }

  // Detectar problemas potenciales
  const inlineObjectCount = (content.match(/\{\s*\w+:\s*\w+/g) || []).length
  if (inlineObjectCount > 5) {
    performance.concerns.push('excessive-inline-objects')
    performance.score -= 10
  }

  const inlineFunctionCount = (content.match(/\(\s*\)\s*=>/g) || []).length
  if (inlineFunctionCount > 3) {
    performance.concerns.push('inline-functions')
    performance.score -= 5
  }

  performance.metrics = {
    inlineObjects: inlineObjectCount,
    inlineFunctions: inlineFunctionCount,
    optimizationCount: performance.optimizations.length
  }

  return performance
}

/**
 * Analizar patrones específicos del componente
 */
function analyzeComponentPatterns(content) {
  const patterns = {
    design: [],
    react: [],
    custom: []
  }

  // Patrones de diseño
  if (content.includes('useState')) patterns.react.push('state-management')
  if (content.includes('useEffect')) patterns.react.push('side-effects')
  if (content.includes('useContext')) patterns.react.push('context-usage')
  if (content.includes('children')) patterns.react.push('composition')

  // Patrones de diseño visual
  if (content.includes('Card') || content.includes('card')) patterns.design.push('card-pattern')
  if (content.includes('Modal') || content.includes('modal')) patterns.design.push('modal-pattern')
  if (content.includes('Button') || content.includes('button')) patterns.design.push('button-pattern')
  if (content.includes('Form') || content.includes('form')) patterns.design.push('form-pattern')

  return patterns
}

/**
 * Calcular calidad del componente
 */
function calculateComponentQuality(content) {
  let score = 100
  const factors = []

  // TypeScript
  if (content.includes('interface') || content.includes('type')) {
    factors.push({ name: 'typescript', impact: +10 })
    score += 10
  }

  // Documentación
  const commentLines = (content.match(/\/\*[\s\S]*?\*\/|\/\/.*/g) || []).length
  if (commentLines > 0) {
    factors.push({ name: 'documentation', impact: +5 })
    score += 5
  }

  // Longitud del archivo
  const lines = content.split('\n').length
  if (lines > 300) {
    factors.push({ name: 'file-length', impact: -10 })
    score -= 10
  } else if (lines < 50) {
    factors.push({ name: 'concise', impact: +5 })
    score += 5
  }

  // Complejidad ciclomática aproximada
  const complexityKeywords = ['if', 'else', 'switch', 'case', 'for', 'while', 'try', 'catch']
  const complexity = complexityKeywords.reduce((sum, keyword) =>
    sum + (content.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length, 0)

  if (complexity > 20) {
    factors.push({ name: 'high-complexity', impact: -15 })
    score -= 15
  } else if (complexity < 5) {
    factors.push({ name: 'low-complexity', impact: +5 })
    score += 5
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    factors,
    complexity,
    lines
  }
}

/**
 * Detectar dominio del componente
 */
function detectComponentDomain(filePath, content) {
  if (filePath.includes('/Sire') || filePath.includes('/sire') || content.includes('SIRE')) {
    return 'SIRE'
  }
  if (filePath.includes('/Muva') || filePath.includes('/muva') || content.includes('MUVA')) {
    return 'MUVA'
  }
  return 'SHARED'
}

/**
 * Analizar patrones globales
 */
function analyzePatterns(components) {
  const patterns = {
    domains: { SIRE: 0, MUVA: 0, SHARED: 0 },
    complexity: { low: 0, medium: 0, high: 0 },
    accessibility: { good: 0, fair: 0, poor: 0 },
    performance: { optimized: 0, standard: 0, needs_work: 0 },
    common_patterns: {}
  }

  Object.values(components).forEach(component => {
    // Conteo por dominio
    patterns.domains[component.domain]++

    // Complejidad
    const lines = component.quality.lines
    if (lines < 100) patterns.complexity.low++
    else if (lines < 300) patterns.complexity.medium++
    else patterns.complexity.high++

    // Accesibilidad
    const a11yScore = component.accessibility.score
    if (a11yScore > 70) patterns.accessibility.good++
    else if (a11yScore > 40) patterns.accessibility.fair++
    else patterns.accessibility.poor++

    // Performance
    const perfScore = component.performance.score
    if (perfScore > 85) patterns.performance.optimized++
    else if (perfScore > 65) patterns.performance.standard++
    else patterns.performance.needs_work++

    // Patrones comunes
    component.patterns.design.forEach(pattern => {
      patterns.common_patterns[pattern] = (patterns.common_patterns[pattern] || 0) + 1
    })
  })

  return patterns
}

/**
 * Calcular métricas de calidad globales
 */
function calculateQualityMetrics(components) {
  const componentArray = Object.values(components)
  const totalComponents = componentArray.length

  if (totalComponents === 0) {
    return { error: 'No components to analyze' }
  }

  const metrics = {
    overall_quality: 0,
    accessibility_avg: 0,
    performance_avg: 0,
    maintainability: 0,
    consistency: 0,
    typescript_coverage: 0
  }

  // Promedios
  metrics.overall_quality = componentArray.reduce((sum, comp) => sum + comp.quality.score, 0) / totalComponents
  metrics.accessibility_avg = componentArray.reduce((sum, comp) => sum + comp.accessibility.score, 0) / totalComponents
  metrics.performance_avg = componentArray.reduce((sum, comp) => sum + comp.performance.score, 0) / totalComponents

  // TypeScript coverage
  const typescriptComponents = componentArray.filter(comp =>
    comp.quality.factors.some(factor => factor.name === 'typescript')).length
  metrics.typescript_coverage = (typescriptComponents / totalComponents) * 100

  // Consistencia (basada en patrones comunes)
  const allPatterns = componentArray.flatMap(comp => comp.patterns.design)
  const uniquePatterns = new Set(allPatterns)
  metrics.consistency = Math.max(0, 100 - (uniquePatterns.size * 5))

  // Mantenibilidad (basada en complejidad y documentación)
  const wellDocumented = componentArray.filter(comp =>
    comp.quality.factors.some(factor => factor.name === 'documentation')).length
  const lowComplexity = componentArray.filter(comp => comp.quality.complexity < 10).length
  metrics.maintainability = ((wellDocumented + lowComplexity) / (totalComponents * 2)) * 100

  return metrics
}

/**
 * Generar recomendaciones
 */
function generateRecommendations(results) {
  const recommendations = []
  const components = Object.values(results.components)

  // Recomendaciones de accesibilidad
  const lowA11yComponents = components.filter(comp => comp.accessibility.score < 50)
  if (lowA11yComponents.length > 0) {
    recommendations.push({
      type: 'accessibility',
      priority: 'high',
      title: 'Mejorar accesibilidad en componentes',
      description: `${lowA11yComponents.length} componentes necesitan mejoras de accesibilidad`,
      components: lowA11yComponents.map(comp => comp.name),
      actions: ['Añadir aria-labels', 'Implementar navegación por teclado', 'Usar elementos semánticos']
    })
  }

  // Recomendaciones de performance
  const lowPerfComponents = components.filter(comp => comp.performance.score < 70)
  if (lowPerfComponents.length > 0) {
    recommendations.push({
      type: 'performance',
      priority: 'medium',
      title: 'Optimizar performance de componentes',
      description: `${lowPerfComponents.length} componentes pueden optimizarse`,
      components: lowPerfComponents.map(comp => comp.name),
      actions: ['Implementar React.memo', 'Usar useCallback/useMemo', 'Evitar objetos inline']
    })
  }

  // Recomendaciones de consistencia
  if (results.quality.consistency < 70) {
    recommendations.push({
      type: 'consistency',
      priority: 'medium',
      title: 'Mejorar consistencia de patrones',
      description: 'Los componentes usan patrones muy diversos',
      actions: ['Crear design system', 'Estandarizar patrones', 'Documentar guías de estilo']
    })
  }

  // Recomendaciones de TypeScript
  if (results.quality.typescript_coverage < 80) {
    recommendations.push({
      type: 'typescript',
      priority: 'low',
      title: 'Aumentar cobertura de TypeScript',
      description: `Solo ${Math.round(results.quality.typescript_coverage)}% de componentes usan TypeScript`,
      actions: ['Añadir interfaces', 'Tipar props', 'Usar tipos estrictos']
    })
  }

  return recommendations
}

/**
 * Mostrar resumen del análisis
 */
function displaySummary(results) {
  console.log('\n' + '='.repeat(60))
  console.log('🔍 RESUMEN DE ANÁLISIS DE COMPONENTES')
  console.log('='.repeat(60))

  console.log(`\n📊 Estadísticas Generales:`)
  console.log(`   • Total componentes: ${results.summary.totalComponents}`)
  console.log(`   • Analizados: ${ANALYSIS_STATE.analyzedFiles}`)
  console.log(`   • Errores: ${ANALYSIS_STATE.errors.length}`)

  console.log(`\n🏗️  Distribución por Dominio:`)
  console.log(`   • SIRE: ${results.patterns.domains.SIRE}`)
  console.log(`   • MUVA: ${results.patterns.domains.MUVA}`)
  console.log(`   • Compartidos: ${results.patterns.domains.SHARED}`)

  console.log(`\n📈 Métricas de Calidad:`)
  console.log(`   • Calidad General: ${Math.round(results.quality.overall_quality)}/100`)
  console.log(`   • Accesibilidad: ${Math.round(results.quality.accessibility_avg)}/100`)
  console.log(`   • Performance: ${Math.round(results.quality.performance_avg)}/100`)
  console.log(`   • Consistencia: ${Math.round(results.quality.consistency)}/100`)
  console.log(`   • TypeScript: ${Math.round(results.quality.typescript_coverage)}%`)

  if (results.recommendations.length > 0) {
    console.log(`\n💡 Principales Recomendaciones:`)
    results.recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec.title} (${rec.priority})`)
    })
  }

  console.log('\n' + '='.repeat(60))
}

// Exportar funciones principales
export {
  analyzeComponents,
  analyzeComponent,
  discoverComponents,
  generateRecommendations
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const options = {
    verbose: args.includes('--verbose'),
    output: args.includes('--output') ? args[args.indexOf('--output') + 1] : null
  }

  analyzeComponents(options)
    .then(results => {
      if (options.output) {
        fs.writeFileSync(options.output, JSON.stringify(results, null, 2))
        log.success(`Resultados guardados en: ${options.output}`)
      }
    })
    .catch(error => {
      log.error(`Error en análisis: ${error.message}`)
      process.exit(1)
    })
}