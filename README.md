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
CLAUDE_MAX_TOKENS=250
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

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

## 🔍 API Endpoints

### Chat Assistant
```bash
POST /api/chat
{
  "question": "¿Qué es el SIRE?",
  "use_context": true,
  "max_context_chunks": 3
}
```

### Validación de Archivos
```bash
POST /api/validate
Content-Type: multipart/form-data
file: <archivo.txt>
```

### Health Check
```bash
GET /api/health
```

## 📋 Validaciones SIRE

El sistema valida archivos con estas especificaciones:

- **Formato**: Archivo .txt con campos separados por TAB
- **Campos**: Exactamente 13 campos obligatorios por registro
- **Tipos de documento válidos**: 3, 5, 46, 10
- **Tamaño máximo**: 10MB

### Campos Obligatorios (13 total)
1. Tipo de documento
2. Número de documento
3. Primer nombre
4. Segundo nombre
5. Primer apellido
6. Segundo apellido
7. Fecha de nacimiento
8. País de nacimiento
9. Sexo
10. Ciudad de hospedaje
11. Fecha ingreso al país
12. Fecha salida del país
13. Observaciones

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

- **Target Response Time**: <600ms desde Colombia
- **Cache Strategy**: Respuestas frecuentes del chat assistant
- **Edge Runtime**: API routes optimizadas
- **Region**: US East (iad1) para menor latencia

## 📞 Soporte

Para problemas técnicos o dudas sobre SIRE, utiliza el chat assistant integrado en la plataforma.

---

**InnPilot** - Simplificando la gestión SIRE para hoteles colombianos 🇨🇴
# Deploy trigger
# Cache optimization deployed
