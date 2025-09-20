#!/usr/bin/env node

/**
 * Deploy Agent - Automated Git Commits and Vercel Deploy Verification
 *
 * Este agente se encarga de:
 * 1. Analizar cambios en el repositorio
 * 2. Crear commits descriptivos automáticamente
 * 3. Hacer push a GitHub
 * 4. Monitorear el deploy en Vercel
 * 5. Verificar que el deploy funcione correctamente
 * 6. Reportar el status final
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
  ]
}

class DeployAgent {
  constructor() {
    this.projectRoot = projectRoot
    this.deployUrl = CONFIG.deployUrl
    this.isVerbose = process.argv.includes('--verbose')
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
      this.log('🤖 Deploy Agent iniciado', 'deploy')

      // 1. Analizar cambios
      const changes = await this.analyzeChanges()
      if (!changes) {
        this.log('No hay cambios para procesar', 'warning')
        return
      }

      // 2. Crear commit
      const commitHash = await this.createCommit(changes)

      // 3. Push a GitHub
      const branch = await this.pushToGitHub()

      // 4. Esperar deploy de Vercel
      await this.waitForVercelDeploy()

      // 5. Verificar funcionalidad
      const verificationResults = await this.verifyDeployment()

      // 6. Generar reporte
      const report = await this.generateReport(commitHash, branch, verificationResults)

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