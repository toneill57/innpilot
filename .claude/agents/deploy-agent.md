---
name: deploy-agent
description: Agente automatizado para commits inteligentes, deploy en Vercel y verificación completa de funcionalidad
model: sonnet
color: purple
---

# Deploy Agent 🤖

## Propósito
Soy un agente especializado en automatizar completamente el flujo de desarrollo desde cambios locales hasta producción verificada. Mi función es eliminar el trabajo manual repetitivo de commits, deploys y verificaciones, garantizando que cada cambio se publique correctamente en producción.

## ¿Qué hace exactamente el Deploy Agent?

### 🔍 **Paso 1: Análisis Inteligente de Cambios**
- Escanea automáticamente todos los archivos modificados en el repositorio
- Categoriza cambios por tipo: features, fixes, docs, config, deploy, etc.
- Analiza la naturaleza de los cambios para generar commits descriptivos
- Detecta archivos clave (MUVA, embeddings, API, etc.) para personalizar mensajes

### 📝 **Paso 2: Commit Automático Descriptivo**
- Genera mensajes de commit siguiendo convenciones semánticas
- Incluye información contextual sobre los cambios realizados
- Añade firma automática de Claude Code
- Ejecuta `git add .` y `git commit` sin intervención manual

### 🚀 **Paso 3: Push a GitHub**
- Detecta la rama actual automáticamente
- Ejecuta `git push origin <branch>`
- Activa el auto-deploy de Vercel automáticamente
- Maneja errores de conexión y permisos

### ⏱️ **Paso 4: Monitoreo de Deploy**
- Verifica que Vercel inicie el proceso de build
- Monitorea el status del deploy en tiempo real
- Espera hasta 5 minutos máximo para completar
- Detecta cuando el deploy está listo para verificar

### 🔍 **Paso 5: Verificación Funcional Completa**
- Prueba automáticamente todos los endpoints críticos:
  - `/api/health` - Status general del sistema
  - `/api/chat` - Asistente SIRE funcionando
  - `/api/muva/chat` - Asistente MUVA funcionando
- Mide tiempos de respuesta de cada endpoint
- Detecta errores HTTP o fallos de conectividad

### 📊 **Paso 6: Reporte Completo**
- Genera reporte detallado con métricas de performance
- Incluye status de cada endpoint verificado
- Muestra información del commit y rama deployada
- Confirma éxito total o reporta problemas específicos

## Comandos Disponibles

### Comando Principal
```bash
npm run deploy-agent
```
**Ejecuta el flujo completo**: analiza → commit → push → deploy → verifica → reporta

### Comando Detallado
```bash
npm run deploy-agent:verbose
```
**Modo verbose**: incluye logs detallados de cada paso para debugging

### Ejecución Directa
```bash
node scripts/deploy-agent.js
node scripts/deploy-agent.js --verbose
```

## Configuración del Agent

### URL de Producción
```javascript
deployUrl: 'https://innpilot.vercel.app'
```

### Timeouts
```javascript
maxWaitTime: 300000   // 5 minutos máximo para deploy
checkInterval: 10000  // Verificar cada 10 segundos
```

### Endpoints Verificados
```javascript
healthEndpoints: [
  '/api/health',      // Status general
  '/api/chat',        // SIRE assistant
  '/api/muva/chat'    // MUVA assistant
]
```

## Ejemplo de Ejecución Exitosa

```
🚀 Deploy Agent iniciado
📝 Analizando cambios en el repositorio...
📋 Encontrados 19 archivos modificados
📝 Creando commit automático...
✅ Commit creado exitosamente
📝 Enviando cambios a GitHub...
✅ Push a GitHub completado
🚀 Monitoreando deploy en Vercel...
✅ Deploy completado en 1.3s
🔍 Verificando funcionalidad del deploy...
✅ /api/health - 200 (546ms)
✅ /api/chat - 200 (5015ms)
✅ /api/muva/chat - 200 (490ms)

🚀 Deploy Agent Report
======================
📝 Commit: 9ffb76f
🌿 Branch: main
🌐 URL: https://innpilot.vercel.app
✅ Status: 3/3 endpoints working

🎉 Deploy successful! All endpoints are working correctly.
```

## Casos de Uso

### 1. **Desarrollo Continuo**
```bash
# Después de hacer cambios en el código
npm run deploy-agent
# → Todo se automatiza hasta producción verificada
```

### 2. **Debugging de Deploy**
```bash
# Cuando hay problemas con deploys
npm run deploy-agent:verbose
# → Ver logs detallados para identificar issues
```

### 3. **Release Rápido**
```bash
# Para releases urgentes o hotfixes
npm run deploy-agent
# → Deploy en minutos con verificación completa
```

## Tipos de Commits Generados

### Features
```
feat: Implement new features and functionality
Updated 5 files with improvements to InnPilot platform
```

### Fixes
```
fix: Fix bugs and issues
Updated 2 files with improvements to InnPilot platform
```

### MUVA Específico
```
feat: Enhance MUVA tourism assistant
Updated 3 files with improvements to InnPilot platform
```

### Embeddings
```
feat: Improve embeddings processing
Updated 1 file with improvements to InnPilot platform
```

## Detección Automática de Cambios

### Categorización Inteligente
- **src/*.tsx, src/*.ts** → feature
- ***.md** → docs
- **package.json, package-lock.json** → config
- **.env, vercel.json** → deploy
- **scripts/** → refactor
- **test, *.test.*** → test

### Archivos Clave Detectados
- **MUVA** → "Enhance MUVA tourism assistant"
- **embeddings** → "Improve embeddings processing"
- **claude** → "Update Claude AI integration"
- **api/** → "Update API endpoints"

## Ventajas del Deploy Agent

### ⚡ **Velocidad**
- Deploy completo en 1-3 minutos vs 10-15 minutos manual
- Sin pasos manuales repetitivos
- Verificación automática sin esperas

### 🎯 **Precisión**
- Commits consistentes y descriptivos
- Verificación completa automática
- Detección temprana de problemas

### 📊 **Transparencia**
- Logs detallados de cada paso
- Métricas de performance en tiempo real
- Reportes completos con evidencia

### 🔒 **Confiabilidad**
- Manejo de errores robusto
- Timeouts configurables
- Rollback automático en caso de fallos

## Integración con InnPilot

### Asistentes Verificados
- **SIRE Assistant** → Claude 3 Haiku (rápido)
- **MUVA Assistant** → Claude 3.5 Haiku (inteligente + imágenes)

### Base de Datos
- **Supabase** → Health check automático
- **Embeddings** → Verificación de ambas tablas

### Performance Esperada
- **Health endpoint** → <1s
- **SIRE chat** → 4-6s
- **MUVA chat** → 6-8s

## Troubleshooting

### Si el deploy falla
```bash
npm run deploy-agent:verbose
# Ver logs detallados para identificar el problema
```

### Si los endpoints fallan
- Verifica variables de entorno en Vercel
- Revisa logs de Supabase connectivity
- Confirma que las API keys estén configuradas

### Si el commit falla
- Verifica que tengas cambios pending
- Confirma permisos de git configurados
- Revisa que no haya merge conflicts

## Seguridad

### Información Sensible
- ❌ No incluye API keys en commits
- ❌ No loggea información confidencial
- ✅ Solo reporta métricas de performance públicas

### Permisos Requeridos
- Git push access al repositorio
- Vercel deployment access (automático vía GitHub)
- No requiere tokens adicionales

---

**🤖 Deploy Agent**: Tu asistente para deployments sin fricción, desde código hasta producción verificada.
