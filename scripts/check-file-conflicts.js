#!/usr/bin/env node

/**
 * 🛡️ SCRIPT DE VERIFICACIÓN DE CONFLICTOS DE ARCHIVOS
 *
 * Detecta archivos que podrían tener buffers sucios en VSCode
 * antes de que Claude Code los modifique.
 *
 * Uso: node scripts/check-file-conflicts.js [path]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const CONFIG = {
  // Extensiones de archivos que típicamente se editan en VSCode
  EDITABLE_EXTENSIONS: ['.js', '.ts', '.jsx', '.tsx', '.md', '.json', '.css', '.scss', '.html', '.vue'],

  // Directorios a excluir del análisis
  EXCLUDE_DIRS: ['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.cache'],

  // Tiempo máximo sin modificación para considerar "archivo activo" (minutos)
  ACTIVE_FILE_THRESHOLD: 30,

  // Archivos críticos que siempre deben verificarse
  CRITICAL_FILES: ['package.json', 'tsconfig.json', 'next.config.ts', 'CLAUDE.md']
};

class FileConflictChecker {
  constructor(rootPath = process.cwd()) {
    this.rootPath = rootPath;
    this.conflicts = [];
    this.warnings = [];
  }

  /**
   * Ejecuta el análisis completo de conflictos
   */
  async run() {
    console.log('🔍 Iniciando verificación de conflictos de archivos...\n');

    try {
      this.checkGitStatus();
      this.checkRecentlyModifiedFiles();
      this.checkCriticalFiles();
      this.generateReport();

      return this.conflicts.length === 0;
    } catch (error) {
      console.error('❌ Error durante la verificación:', error.message);
      return false;
    }
  }

  /**
   * Verifica el estado de Git para detectar archivos modificados
   */
  checkGitStatus() {
    try {
      const gitStatus = execSync('git status --porcelain', {
        cwd: this.rootPath,
        encoding: 'utf8'
      });

      if (gitStatus.trim()) {
        const modifiedFiles = gitStatus
          .split('\n')
          .filter(line => line.trim())
          .map(line => ({
            status: line.substring(0, 2),
            file: line.substring(3)
          }));

        modifiedFiles.forEach(({ status, file }) => {
          if (status.includes('M')) {
            this.conflicts.push({
              type: 'git_modified',
              file,
              message: `Archivo modificado en Git (posible buffer sucio en VSCode)`,
              severity: 'high'
            });
          }
        });
      }
    } catch (error) {
      this.warnings.push('No se pudo verificar el estado de Git');
    }
  }

  /**
   * Verifica archivos modificados recientemente
   */
  checkRecentlyModifiedFiles() {
    const now = Date.now();
    const thresholdMs = CONFIG.ACTIVE_FILE_THRESHOLD * 60 * 1000;

    this.walkDirectory(this.rootPath, (filePath) => {
      const relativePath = path.relative(this.rootPath, filePath);
      const ext = path.extname(filePath);

      // Solo verificar archivos editables
      if (!CONFIG.EDITABLE_EXTENSIONS.includes(ext)) return;

      try {
        const stats = fs.statSync(filePath);
        const timeSinceModified = now - stats.mtime.getTime();

        if (timeSinceModified < thresholdMs) {
          this.warnings.push({
            type: 'recently_modified',
            file: relativePath,
            message: `Modificado hace ${Math.round(timeSinceModified / 60000)} minutos`,
            severity: 'medium',
            lastModified: stats.mtime
          });
        }
      } catch (error) {
        // Ignorar errores de acceso a archivos
      }
    });
  }

  /**
   * Verifica archivos críticos del proyecto
   */
  checkCriticalFiles() {
    CONFIG.CRITICAL_FILES.forEach(filename => {
      const filePath = path.join(this.rootPath, filename);

      if (fs.existsSync(filePath)) {
        try {
          const stats = fs.statSync(filePath);
          const now = Date.now();
          const timeSinceModified = now - stats.mtime.getTime();

          // Si el archivo crítico fue modificado en los últimos 5 minutos
          if (timeSinceModified < 5 * 60 * 1000) {
            this.conflicts.push({
              type: 'critical_file',
              file: filename,
              message: `Archivo crítico modificado recientemente`,
              severity: 'high',
              lastModified: stats.mtime
            });
          }
        } catch (error) {
          // Ignorar errores de acceso
        }
      }
    });
  }

  /**
   * Recorre directorios recursivamente
   */
  walkDirectory(dir, callback) {
    try {
      const items = fs.readdirSync(dir);

      items.forEach(item => {
        const fullPath = path.join(dir, item);

        // Excluir directorios configurados
        if (CONFIG.EXCLUDE_DIRS.includes(item)) return;

        try {
          const stats = fs.statSync(fullPath);

          if (stats.isDirectory()) {
            this.walkDirectory(fullPath, callback);
          } else {
            callback(fullPath);
          }
        } catch (error) {
          // Ignorar errores de acceso
        }
      });
    } catch (error) {
      // Ignorar errores de lectura de directorio
    }
  }

  /**
   * Genera reporte final
   */
  generateReport() {
    console.log('📊 REPORTE DE VERIFICACIÓN DE CONFLICTOS\n');

    if (this.conflicts.length === 0 && this.warnings.length === 0) {
      console.log('✅ No se detectaron conflictos potenciales');
      console.log('🚀 Seguro proceder con modificaciones de Claude Code\n');
      return;
    }

    // Mostrar conflictos críticos
    if (this.conflicts.length > 0) {
      console.log('🚨 CONFLICTOS DETECTADOS (ACCIÓN REQUERIDA):');
      this.conflicts.forEach((conflict, index) => {
        console.log(`${index + 1}. ${conflict.file}`);
        console.log(`   ${conflict.message}`);
        console.log(`   Severidad: ${conflict.severity}`);
        if (conflict.lastModified) {
          console.log(`   Última modificación: ${conflict.lastModified.toLocaleString()}`);
        }
        console.log('');
      });
    }

    // Mostrar advertencias
    if (this.warnings.length > 0) {
      console.log('⚠️  ADVERTENCIAS:');
      this.warnings.forEach((warning, index) => {
        if (typeof warning === 'string') {
          console.log(`${index + 1}. ${warning}`);
        } else {
          console.log(`${index + 1}. ${warning.file}: ${warning.message}`);
        }
      });
      console.log('');
    }

    // Recomendaciones
    this.generateRecommendations();
  }

  /**
   * Genera recomendaciones basadas en los conflictos encontrados
   */
  generateRecommendations() {
    console.log('💡 RECOMENDACIONES:');

    if (this.conflicts.some(c => c.type === 'git_modified')) {
      console.log('• Cerrar archivos abiertos en VSCode antes de que Claude los modifique');
      console.log('• Usar Cmd+K Cmd+W para cerrar todos los archivos en VSCode');
    }

    if (this.conflicts.some(c => c.type === 'critical_file')) {
      console.log('• Hacer commit de cambios críticos antes de continuar');
      console.log('• Verificar que la configuración del proyecto esté estable');
    }

    if (this.warnings.length > 0) {
      console.log('• Considerar hacer backup de archivos recientemente modificados');
    }

    console.log('• Asegurar que VSCode tenga la configuración auto-refresh activada');
    console.log('• Usar "files.autoSave": "afterDelay" en settings.json\n');
  }
}

// Ejecución del script
if (import.meta.url === `file://${process.argv[1]}`) {
  const targetPath = process.argv[2] || process.cwd();
  const checker = new FileConflictChecker(targetPath);

  checker.run().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { FileConflictChecker };