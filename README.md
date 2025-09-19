# InnPilot - Plataforma de Gestión SIRE

InnPilot es una plataforma web moderna para ayudar a hoteles colombianos con la gestión y subida de información al SIRE (Sistema de Información y Registro de Extranjeros).

## 🚀 Características

- **Validador de Archivos SIRE**: Validación en tiempo real de archivos .txt con formato SIRE
- **Chat Assistant Inteligente**: Asistente AI especializado en procedimientos SIRE
- **Dashboard Integral**: Interface moderna con métricas y navegación intuitiva
- **Performance Optimizada**: <600ms response time desde Colombia

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes (Edge Runtime)
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: OpenAI embeddings + Anthropic Claude
- **Deploy**: Vercel US East

## 🔧 Setup de Desarrollo

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd InnPilot
npm install
```

### 2. Configurar variables de entorno

Crear `.env.local`:

```env
SUPABASE_URL=https://ooaumjzaztmutltifhoq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-api03-...
CLAUDE_MODEL=claude-3-haiku-20240307
CLAUDE_MAX_TOKENS=800
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación está disponible en:
- **Producción**: https://innpilot.vercel.app
- **Desarrollo local**: http://localhost:3000

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts         # Chat assistant endpoint
│   │   ├── validate/route.ts     # File validation endpoint
│   │   └── health/route.ts       # Health check endpoint
│   ├── globals.css               # Estilos globales
│   └── page.tsx                  # Dashboard principal
├── components/
│   ├── Dashboard/                # Componente dashboard
│   ├── ChatAssistant/           # Chat assistant
│   ├── FileUploader/            # Validador de archivos
│   └── ui/                      # Componentes UI base
└── lib/
    ├── supabase.ts              # Cliente Supabase
    ├── openai.ts                # Cliente OpenAI
    ├── claude.ts                # Cliente Anthropic
    └── utils.ts                 # Utilidades y validaciones
```

## 🔗 API Integration

### Chat Assistant API
```javascript
// Consultar el asistente SIRE
const response = await fetch('https://innpilot.vercel.app/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    question: "¿Cuáles son los documentos válidos para SIRE?",
    use_context: true,
    max_context_chunks: 4
  })
});

const data = await response.json();
console.log(data.response);
```

### File Validation API
```javascript
// Validar archivo SIRE
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('https://innpilot.vercel.app/api/validate', {
  method: 'POST',
  body: formData
});

const validation = await response.json();
if (validation.isValid) {
  console.log('Archivo válido:', validation.lineCount, 'registros');
} else {
  console.log('Errores encontrados:', validation.errors);
}
```

### System Health Check
```javascript
// Verificar estado del sistema
const health = await fetch('https://innpilot.vercel.app/api/health')
  .then(res => res.json());

console.log('Sistema:', health.status); // "healthy"
console.log('Servicios:', health.services);
```

## 📋 Proceso y Validaciones SIRE

### 7 Pasos Oficiales para Reportar al SIRE

**Según documento oficial del gobierno colombiano:**

1. **Tener como base** el formato ejemplo del archivo SIRE
2. **Anotar la información** tomándola del pasaporte tal como aparece en el documento
3. **Escribir los datos correctamente** en cada casilla siguiendo orden estricto sin eliminar columnas
4. **Aplicar tipo de información correcto** en cada casilla según especificaciones de campo
5. **Limpiar el formato** eliminando enunciados/títulos, dejando solo datos del reporte
6. **Guardar como TXT** escogiendo formato texto delimitado por tabulaciones
7. **Validar archivo final** - solo el archivo TXT es leído por el sistema SIRE

### Especificaciones de Validación

El sistema valida archivos con estas especificaciones:

- **Formato**: Archivo .txt con campos separados por TAB
- **Campos**: Exactamente 13 campos obligatorios por registro
- **Tipos de documento válidos**: 3 (Pasaporte), 5 (Cédula extranjería), 46 (Carné diplomático), 10 (Documento extranjero)
- **Tamaño máximo**: 10MB
- **Formatos de fecha**: día/mes/año (solo números)
- **Tipos de movimiento**: E (Entrada) o S (Salida)

### Campos Obligatorios (13 total)
**Según documento oficial SIRE:**

1. **Código del hotel** - Código asignado por sistema SCH (solo números)
2. **Código de ciudad** - Código de la ciudad del establecimiento (solo números)
3. **Tipo de documento** - Pasaporte (3), Cédula extranjería (5), Carné diplomático (46), Documento extranjero (10)
4. **Número de identificación** - Número del documento (alfanumérico)
5. **Código nacionalidad** - Código de nacionalidad (solo números)
6. **Primer apellido** - Primer apellido del extranjero (solo letras)
7. **Segundo apellido** - Segundo apellido, puede quedar en blanco (solo letras)
8. **Nombre del extranjero** - Nombre(s) del extranjero (solo letras)
9. **Tipo de movimiento** - Entrada (E) o Salida (S)
10. **Fecha del movimiento** - Fecha de entrada/salida (día/mes/año, solo números)
11. **Lugar de procedencia** - Lugar de origen (solo números)
12. **Lugar de destino** - Lugar de destino (solo números)
13. **Fecha de nacimiento** - Fecha de nacimiento (día/mes/año, solo números)

## 🚀 Deploy

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

La aplicación se desplegará automáticamente en US East para optimizar latencia desde Colombia.

### Variables de Entorno en Vercel

Configurar las mismas variables de `.env.local` en el dashboard de Vercel.

## 🔐 Base de Datos

### Supabase Schema

```sql
-- Tabla principal (ya configurada)
document_embeddings (
  id uuid PRIMARY KEY,
  content text,
  embedding vector(3072),
  metadata jsonb,
  created_at timestamp
)

-- Función de búsqueda (ya implementada)
match_documents(query_embedding, similarity_threshold, match_count)
```

## 🎯 Performance

- **Current Response Time**: ~490ms desde Colombia (producción)
- **Cache Response Time**: ~21ms-328ms (respuestas repetidas)
- **Cache Strategy**: Respuestas frecuentes del chat assistant
- **Edge Runtime**: API routes optimizadas
- **Region**: US East (iad1) para menor latencia

## 📞 Soporte

Para usar InnPilot y resolver dudas sobre SIRE:

### 🌐 Interfaz Web Principal
- **Chat Assistant**: https://innpilot.vercel.app
- **Validación de Archivos**: Disponible en la interfaz web
- **Documentación Técnica**: `/docs/` (para desarrolladores)

### 💻 Para Desarrolladores
- **API Documentation**: Ejemplos de integración arriba
- **System Health**: Monitore el estado del sistema
- **Development Setup**: Ver sección de configuración

---

**InnPilot** - Simplificando la gestión SIRE para hoteles colombianos 🇨🇴
# Deploy trigger
# Cache optimization deployed
