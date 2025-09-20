#!/usr/bin/env node

/**
 * Deploy Agent - Automated Git Commits and Vercel Deploy Verification
 *
 * Este agente se encarga de:
 * 1. Diagnosticar configuración de variables de entorno en Vercel
 * 2. Comparar variables locales vs producción
 * 3. Aplicar correcciones automáticas si es necesario
 * 4. Analizar cambios en el repositorio
 * 5. Crear commits descriptivos automáticamente
 * 6. Hacer push a GitHub
 * 7. Monitorear el deploy en Vercel
 * 8. Verificar que el deploy funcione correctamente
 * 9. Reportar el status final con diagnóstico completo
 */

import { execSync, spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.dirname(__dirname)

// Configuración del agente
const CONFIG = {
  deployUrl: 'https://innpilot.vercel.app',
  maxWaitTime: 300000, // 5 minutos max para deploy
  checkInterval: 10000, // Verificar cada 10 segundos
  healthEndpoints: [
    '/api/health',
    '/api/chat',
    '/api/muva/chat'
  ],
  vercel: {
    apiToken: 'jqBCRguPAbRYHYTXgxOVse5h',
    baseUrl: 'https://api.vercel.com',
    projectName: 'innpilot'
  },
  requiredEnvVars: [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL' // Esta es la clave del problema
  ]
}

class DeployAgent {
  constructor() {
    this.projectRoot = projectRoot
    this.deployUrl = CONFIG.deployUrl
    this.isVerbose = process.argv.includes('--verbose')
    this.vercelProjectId = null
    this.localEnvVars = null
    this.productionEnvVars = null
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const icons = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      deploy: '🚀',
      git: '📝',
      verify: '🔍'
    }

    console.log(`${icons[type] || '📋'} [${timestamp}] ${message}`)
  }

  async exec(command, options = {}) {
    try {
      if (this.isVerbose) {
        this.log(`Executing: ${command}`, 'info')
      }

      const result = execSync(command, {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        ...options
      })
      return result.trim()
    } catch (error) {
      throw new Error(`Command failed: ${command}\n${error.message}`)
    }
  }

  async loadLocalEnvVars() {
    this.log('Cargando variables de entorno locales...', 'info')

    try {
      const envLocalPath = path.join(this.projectRoot, '.env.local')
      const envPath = path.join(this.projectRoot, '.env')

      let envContent = ''

      if (fs.existsSync(envLocalPath)) {
        envContent = fs.readFileSync(envLocalPath, 'utf-8')
        this.log('Archivo .env.local encontrado', 'success')
      } else if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8')
        this.log('Archivo .env encontrado', 'success')
      } else {
        this.log('No se encontró archivo .env.local ni .env', 'warning')
        return {}
      }

      const envVars = {}
      const lines = envContent.split('\n')

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=')
          const value = valueParts.join('=').replace(/^["']|["']$/g, '')
          envVars[key.trim()] = value
        }
      }

      this.localEnvVars = envVars
      this.log(`Cargadas ${Object.keys(envVars).length} variables locales`, 'success')

      if (this.isVerbose) {
        const safeVars = Object.keys(envVars).reduce((acc, key) => {
          acc[key] = key.includes('KEY') || key.includes('SECRET') ? '[HIDDEN]' : envVars[key]
          return acc
        }, {})
        this.log(`Variables locales: ${JSON.stringify(safeVars, null, 2)}`, 'info')
      }

      return envVars
    } catch (error) {
      throw new Error(`Error cargando variables locales: ${error.message}`)
    }
  }

  async getVercelProjectInfo() {
    this.log('Obteniendo información del proyecto en Vercel...', 'info')

    try {
      const response = await fetch(`${CONFIG.vercel.baseUrl}/v9/projects`, {
        headers: {
          'Authorization': `Bearer ${CONFIG.vercel.apiToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Error en API de Vercel: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const project = data.projects.find(p => p.name === CONFIG.vercel.projectName)

      if (!project) {
        throw new Error(`Proyecto '${CONFIG.vercel.projectName}' no encontrado en Vercel`)
      }

      this.vercelProjectId = project.id
      this.log(`Proyecto encontrado: ${project.name} (${project.id})`, 'success')

      return project
    } catch (error) {
      throw new Error(`Error obteniendo info del proyecto: ${error.message}`)
    }
  }

  async getVercelEnvVars() {
    this.log('Obteniendo variables de entorno de producción...', 'info')

    try {
      const response = await fetch(`${CONFIG.vercel.baseUrl}/v9/projects/${this.vercelProjectId}/env`, {
        headers: {
          'Authorization': `Bearer ${CONFIG.vercel.apiToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Error obteniendo env vars: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const envVars = {}

      data.envs.forEach(env => {
        if (env.target.includes('production')) {
          envVars[env.key] = {
            value: env.value,
            target: env.target,
            type: env.type,
            id: env.id
          }
        }
      })

      this.productionEnvVars = envVars
      this.log(`Encontradas ${Object.keys(envVars).length} variables en producción`, 'success')

      if (this.isVerbose) {
        const safeVars = Object.keys(envVars).reduce((acc, key) => {
          acc[key] = {
            ...envVars[key],
            value: key.includes('KEY') || key.includes('SECRET') ? '[HIDDEN]' : envVars[key].value
          }
          return acc
        }, {})
        this.log(`Variables de producción: ${JSON.stringify(safeVars, null, 2)}`, 'info')
      }

      return envVars
    } catch (error) {
      throw new Error(`Error obteniendo variables de entorno: ${error.message}`)
    }
  }

  async diagnoseEnvironmentVariables() {
    this.log('🔍 Diagnosticando configuración de variables de entorno...', 'verify')

    const diagnosis = {
      missing: [],
      mismatched: [],
      extras: [],
      critical: []
    }

    // Verificar variables requeridas
    for (const varName of CONFIG.requiredEnvVars) {
      const localValue = this.localEnvVars[varName]
      const prodVar = this.productionEnvVars[varName]

      if (!prodVar) {
        diagnosis.missing.push(varName)
        if (varName === 'NEXT_PUBLIC_SUPABASE_URL') {
          diagnosis.critical.push({
            var: varName,
            issue: 'Variable crítica faltante - causa error "supabaseUrl is required"',
            fix: 'Agregar NEXT_PUBLIC_SUPABASE_URL a Vercel'
          })
        }
      } else if (localValue && localValue !== prodVar.value) {
        diagnosis.mismatched.push({
          var: varName,
          local: localValue,
          production: prodVar.value
        })
      }
    }

    // Verificar variables extra en producción
    for (const varName of Object.keys(this.productionEnvVars)) {
      if (!CONFIG.requiredEnvVars.includes(varName)) {
        diagnosis.extras.push(varName)
      }
    }

    // Reporte del diagnóstico
    this.log('📊 Diagnóstico de Variables de Entorno:', 'info')

    if (diagnosis.critical.length > 0) {
      this.log('🚨 PROBLEMAS CRÍTICOS DETECTADOS:', 'error')
      diagnosis.critical.forEach(issue => {
        this.log(`  ❌ ${issue.var}: ${issue.issue}`, 'error')
        this.log(`     Solución: ${issue.fix}`, 'info')
      })
    }

    if (diagnosis.missing.length > 0) {
      this.log(`⚠️  Variables faltantes (${diagnosis.missing.length}):`, 'warning')
      diagnosis.missing.forEach(varName => {
        this.log(`  - ${varName}`, 'warning')
      })
    }

    if (diagnosis.mismatched.length > 0) {
      this.log(`⚠️  Variables con valores diferentes (${diagnosis.mismatched.length}):`, 'warning')
      diagnosis.mismatched.forEach(mismatch => {
        const isSecret = mismatch.var.includes('KEY') || mismatch.var.includes('SECRET')
        this.log(`  - ${mismatch.var}: ${isSecret ? '[HIDDEN]' : mismatch.local} → ${isSecret ? '[HIDDEN]' : mismatch.production}`, 'warning')
      })
    }

    if (diagnosis.extras.length > 0 && this.isVerbose) {
      this.log(`ℹ️  Variables extra en producción (${diagnosis.extras.length}):`, 'info')
      diagnosis.extras.forEach(varName => {
        this.log(`  + ${varName}`, 'info')
      })
    }

    return diagnosis
  }

  async fixMissingNextPublicSupabaseUrl() {
    this.log('🔧 Aplicando corrección para NEXT_PUBLIC_SUPABASE_URL...', 'deploy')

    try {
      const supabaseUrl = this.localEnvVars['SUPABASE_URL']

      if (!supabaseUrl) {
        throw new Error('SUPABASE_URL no encontrada en variables locales')
      }

      // Crear la variable de entorno en Vercel
      const response = await fetch(`${CONFIG.vercel.baseUrl}/v10/projects/${this.vercelProjectId}/env`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.vercel.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: 'NEXT_PUBLIC_SUPABASE_URL',
          value: supabaseUrl,
          type: 'plain',
          target: ['production', 'preview', 'development']
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Error creando variable en Vercel: ${response.status} ${errorData}`)
      }

      const result = await response.json()
      this.log('✅ NEXT_PUBLIC_SUPABASE_URL agregada exitosamente a Vercel', 'success')
      this.log(`   ID: ${result.id}`, 'info')

      return result
    } catch (error) {
      throw new Error(`Error aplicando corrección: ${error.message}`)
    }
  }

  async runEnvironmentDiagnosis() {
    this.log('🚀 Iniciando diagnóstico completo de entorno...', 'deploy')

    try {
      // 1. Cargar variables locales
      await this.loadLocalEnvVars()

      // 2. Obtener info del proyecto Vercel
      await this.getVercelProjectInfo()

      // 3. Obtener variables de Vercel
      await this.getVercelEnvVars()

      // 4. Diagnosticar diferencias
      const diagnosis = await this.diagnoseEnvironmentVariables()

      // 5. Aplicar correcciones si es necesario
      let fixed = false
      if (diagnosis.critical.length > 0) {
        const nextPublicIssue = diagnosis.critical.find(issue => issue.var === 'NEXT_PUBLIC_SUPABASE_URL')
        if (nextPublicIssue) {
          await this.fixMissingNextPublicSupabaseUrl()
          fixed = true

          // Re-verificar después de la corrección
          this.log('🔄 Re-verificando después de aplicar corrección...', 'info')
          await this.getVercelEnvVars()
          await this.diagnoseEnvironmentVariables()
        }
      }

      return {
        diagnosis,
        fixed,
        needsRedeploy: fixed
      }
    } catch (error) {
      throw new Error(`Error en diagnóstico de entorno: ${error.message}`)
    }
  }

  async analyzeChanges() {
    this.log('Analizando cambios en el repositorio...', 'git')

    try {
      // Verificar si hay cambios
      const status = await this.exec('git status --porcelain')
      if (!status) {
        this.log('No hay cambios para commitear', 'warning')
        return null
      }

      // Obtener lista de archivos modificados
      const modifiedFiles = status
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const statusCode = line.substring(0, 2).trim()
          const filePath = line.substring(3)
          return { status: statusCode, file: filePath }
        })

      // Analizar tipos de cambios
      const changeTypes = this.categorizeChanges(modifiedFiles)

      this.log(`Encontrados ${modifiedFiles.length} archivos modificados`, 'info')
      if (this.isVerbose) {
        modifiedFiles.forEach(({ status, file }) => {
          this.log(`  ${status} ${file}`, 'info')
        })
      }

      return {
        files: modifiedFiles,
        types: changeTypes,
        summary: this.generateCommitMessage(changeTypes, modifiedFiles)
      }
    } catch (error) {
      throw new Error(`Error analizando cambios: ${error.message}`)
    }
  }

  categorizeChanges(files) {
    const categories = {
      feature: [],
      fix: [],
      docs: [],
      style: [],
      refactor: [],
      test: [],
      config: [],
      deploy: []
    }

    files.forEach(({ file }) => {
      if (file.includes('src/') && file.endsWith('.tsx')) {
        categories.feature.push(file)
      } else if (file.includes('src/') && file.endsWith('.ts')) {
        categories.feature.push(file)
      } else if (file.includes('.md')) {
        categories.docs.push(file)
      } else if (file.includes('package.json') || file.includes('package-lock.json')) {
        categories.config.push(file)
      } else if (file.includes('.env') || file.includes('vercel.json')) {
        categories.deploy.push(file)
      } else if (file.includes('scripts/')) {
        categories.refactor.push(file)
      } else if (file.includes('test') || file.includes('.test.')) {
        categories.test.push(file)
      } else if (file.includes('styles') || file.includes('.css')) {
        categories.style.push(file)
      } else {
        categories.feature.push(file)
      }
    })

    return categories
  }

  generateCommitMessage(changeTypes, files) {
    const totalFiles = files.length

    // Determinar el tipo principal de cambio
    let primaryType = 'feat'
    let description = ''

    if (changeTypes.feature.length > 0) {
      primaryType = 'feat'
      description = 'Implement new features and functionality'
    } else if (changeTypes.fix.length > 0) {
      primaryType = 'fix'
      description = 'Fix bugs and issues'
    } else if (changeTypes.deploy.length > 0) {
      primaryType = 'deploy'
      description = 'Update deployment configuration'
    } else if (changeTypes.config.length > 0) {
      primaryType = 'config'
      description = 'Update project configuration'
    } else if (changeTypes.docs.length > 0) {
      primaryType = 'docs'
      description = 'Update documentation'
    } else if (changeTypes.refactor.length > 0) {
      primaryType = 'refactor'
      description = 'Refactor code structure'
    }

    // Detectar archivos clave
    const keyFiles = files.filter(({ file }) =>
      file.includes('MUVA') ||
      file.includes('embeddings') ||
      file.includes('claude') ||
      file.includes('api/')
    )

    if (keyFiles.length > 0) {
      const keyFile = keyFiles[0].file
      if (keyFile.includes('MUVA') || keyFile.includes('muva')) {
        description = 'Enhance MUVA tourism assistant'
      } else if (keyFile.includes('embeddings')) {
        description = 'Improve embeddings processing'
      } else if (keyFile.includes('claude')) {
        description = 'Update Claude AI integration'
      } else if (keyFile.includes('api/')) {
        description = 'Update API endpoints'
      }
    }

    const message = `${primaryType}: ${description}

Updated ${totalFiles} file${totalFiles > 1 ? 's' : ''} with improvements to InnPilot platform

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`

    return message
  }

  async createCommit(changes) {
    this.log('Creando commit automático...', 'git')

    try {
      // Agregar todos los archivos modificados
      await this.exec('git add .')

      // Crear commit con mensaje generado
      const commitMessage = changes.summary
      await this.exec(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`)

      this.log('Commit creado exitosamente', 'success')

      // Obtener hash del commit
      const commitHash = await this.exec('git rev-parse HEAD')
      return commitHash.substring(0, 7)
    } catch (error) {
      throw new Error(`Error creando commit: ${error.message}`)
    }
  }

  async pushToGitHub() {
    this.log('Enviando cambios a GitHub...', 'git')

    try {
      const currentBranch = await this.exec('git branch --show-current')
      await this.exec(`git push origin ${currentBranch}`)

      this.log('Push a GitHub completado', 'success')
      return currentBranch
    } catch (error) {
      throw new Error(`Error en push: ${error.message}`)
    }
  }

  async waitForVercelDeploy() {
    this.log('Monitoreando deploy en Vercel...', 'deploy')

    const startTime = Date.now()
    let attempts = 0
    const maxAttempts = CONFIG.maxWaitTime / CONFIG.checkInterval

    while (attempts < maxAttempts) {
      try {
        // Verificar si el deploy está listo
        const response = await fetch(`${CONFIG.deployUrl}/api/health`)

        if (response.ok) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
          this.log(`Deploy completado en ${elapsed}s`, 'success')
          return true
        }

        attempts++
        if (attempts % 3 === 0) {
          this.log(`Esperando deploy... (${attempts}/${maxAttempts})`, 'deploy')
        }

        await new Promise(resolve => setTimeout(resolve, CONFIG.checkInterval))

      } catch (error) {
        attempts++
        if (this.isVerbose) {
          this.log(`Deploy check failed (attempt ${attempts}): ${error.message}`, 'warning')
        }

        await new Promise(resolve => setTimeout(resolve, CONFIG.checkInterval))
      }
    }

    throw new Error('Deploy timeout - Vercel no respondió en el tiempo esperado')
  }

  async verifyDeployment() {
    this.log('Verificando funcionalidad del deploy...', 'verify')

    const results = []

    for (const endpoint of CONFIG.healthEndpoints) {
      try {
        const url = `${CONFIG.deployUrl}${endpoint}`
        this.log(`Verificando ${endpoint}...`, 'verify')

        const startTime = Date.now()
        const response = await fetch(url, {
          method: endpoint.includes('/chat') ? 'POST' : 'GET',
          headers: endpoint.includes('/chat') ? {
            'Content-Type': 'application/json'
          } : {},
          body: endpoint.includes('/chat') ? JSON.stringify({
            question: 'test deployment'
          }) : undefined
        })

        const responseTime = Date.now() - startTime

        const result = {
          endpoint,
          status: response.status,
          ok: response.ok,
          responseTime,
          error: null
        }

        if (response.ok) {
          this.log(`✅ ${endpoint} - ${response.status} (${responseTime}ms)`, 'success')
        } else {
          this.log(`❌ ${endpoint} - ${response.status} (${responseTime}ms)`, 'error')
          result.error = `HTTP ${response.status}`
        }

        results.push(result)

      } catch (error) {
        this.log(`❌ ${endpoint} - Error: ${error.message}`, 'error')
        results.push({
          endpoint,
          status: 0,
          ok: false,
          responseTime: 0,
          error: error.message
        })
      }
    }

    return results
  }

  async generateEnhancedReport(commitHash, branch, verificationResults, envDiagnosis) {
    const successful = verificationResults.filter(r => r.ok).length
    const total = verificationResults.length
    const allPassed = successful === total

    const report = `
🚀 Deploy Agent Enhanced Report
================================

📝 Commit: ${commitHash}
🌿 Branch: ${branch}
🌐 URL: ${CONFIG.deployUrl}
${allPassed ? '✅' : '❌'} Status: ${successful}/${total} endpoints working

🔧 Environment Diagnosis:
${envDiagnosis.fixed ? '✅ Variables de entorno corregidas automáticamente' : '✅ Variables de entorno verificadas'}
${envDiagnosis.diagnosis.missing.length > 0 ? `⚠️  Variables faltantes: ${envDiagnosis.diagnosis.missing.join(', ')}` : '✅ Todas las variables requeridas presentes'}
${envDiagnosis.diagnosis.critical.length > 0 ? `🚨 Problemas críticos resueltos: ${envDiagnosis.diagnosis.critical.length}` : '✅ Sin problemas críticos'}

📊 Endpoint Verification:
${verificationResults.map(r =>
  `${r.ok ? '✅' : '❌'} ${r.endpoint} - ${r.status} (${r.responseTime}ms)${r.error ? ` - ${r.error}` : ''}`
).join('\n')}

${allPassed ?
  envDiagnosis.fixed ?
    '🎉 Deploy successful! Environment variables fixed and all endpoints working!' :
    '🎉 Deploy successful! All endpoints are working correctly.' :
  '⚠️  Deploy completed but some endpoints have issues. Please review.'
}

🔍 Detailed Analysis:
${envDiagnosis.diagnosis.critical.length > 0 ?
  envDiagnosis.diagnosis.critical.map(issue =>
    `  🔧 Fixed: ${issue.var} - ${issue.issue}`
  ).join('\n') + '\n' : ''
}${verificationResults.filter(r => !r.ok).length > 0 ?
  '  ❌ Failed endpoints need investigation\n' : ''
}
Generated at: ${new Date().toISOString()}
`

    this.log(report, allPassed ? 'success' : 'warning')

    return {
      success: allPassed,
      report,
      results: verificationResults,
      envDiagnosis
    }
  }

  async generateReport(commitHash, branch, verificationResults) {
    const successful = verificationResults.filter(r => r.ok).length
    const total = verificationResults.length
    const allPassed = successful === total

    const report = `
🚀 Deploy Agent Report
======================

📝 Commit: ${commitHash}
🌿 Branch: ${branch}
🌐 URL: ${CONFIG.deployUrl}
${allPassed ? '✅' : '❌'} Status: ${successful}/${total} endpoints working

📊 Endpoint Verification:
${verificationResults.map(r =>
  `${r.ok ? '✅' : '❌'} ${r.endpoint} - ${r.status} (${r.responseTime}ms)${r.error ? ` - ${r.error}` : ''}`
).join('\n')}

${allPassed ?
  '🎉 Deploy successful! All endpoints are working correctly.' :
  '⚠️  Deploy completed but some endpoints have issues. Please review.'
}

Generated at: ${new Date().toISOString()}
`

    this.log(report, allPassed ? 'success' : 'warning')

    return {
      success: allPassed,
      report,
      results: verificationResults
    }
  }

  async run() {
    try {
      this.log('🤖 Deploy Agent iniciado con diagnóstico avanzado', 'deploy')

      // 1. NUEVO: Diagnóstico completo de variables de entorno
      const envDiagnosis = await this.runEnvironmentDiagnosis()

      // 2. Analizar cambios
      const changes = await this.analyzeChanges()
      if (!changes && !envDiagnosis.needsRedeploy) {
        this.log('No hay cambios para procesar y entorno está correcto', 'warning')
        return
      }

      // 3. Crear commit (si hay cambios)
      let commitHash = 'env-fix'
      let branch = 'main'

      if (changes) {
        commitHash = await this.createCommit(changes)
        // 4. Push a GitHub
        branch = await this.pushToGitHub()
      } else if (envDiagnosis.fixed) {
        this.log('Variables de entorno corregidas - forzando redeploy...', 'deploy')
        // Crear un commit vacío para forzar redeploy
        await this.exec('git commit --allow-empty -m "fix: Force redeploy after environment variables correction\n\n🤖 Generated with [Claude Code](https://claude.ai/code)\n\nCo-Authored-By: Claude <noreply@anthropic.com>"')
        commitHash = await this.exec('git rev-parse HEAD')
        commitHash = commitHash.substring(0, 7)
        branch = await this.pushToGitHub()
      }

      // 5. Esperar deploy de Vercel
      await this.waitForVercelDeploy()

      // 6. Verificar funcionalidad
      const verificationResults = await this.verifyDeployment()

      // 7. Generar reporte completo
      const report = await this.generateEnhancedReport(commitHash, branch, verificationResults, envDiagnosis)

      if (report.success) {
        this.log('🎉 Deploy Agent completado exitosamente', 'success')
        process.exit(0)
      } else {
        this.log('⚠️  Deploy completado con warnings', 'warning')
        process.exit(1)
      }

    } catch (error) {
      this.log(`Deploy Agent falló: ${error.message}`, 'error')
      console.error(error)
      process.exit(1)
    }
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = new DeployAgent()
  agent.run()
}

export default DeployAgent