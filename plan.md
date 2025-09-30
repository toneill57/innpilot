# Plan: Sistema Conversacional Premium para Huéspedes

> **Producto Core**: Asistente AI conversacional con memoria persistente para huéspedes de hoteles

**Última actualización**: 30 de Septiembre de 2025
**Estado**: En planificación
**Prioridad**: P0 (Core Product)

---

## 📋 Resumen Ejecutivo

### Objetivo
Desarrollar un sistema conversacional inteligente que permita a los huéspedes interactuar de manera natural con un asistente AI que:
- Recuerda el contexto completo de la conversación
- Proporciona recomendaciones personalizadas sobre el hotel y turismo local
- Mantiene conversaciones persistentes ligadas a cada reserva

### Propuesta de Valor
- **Para Huéspedes**: Asistente personal 24/7 que conoce su reserva y contexto
- **Para Hoteles**: Reduce carga operativa del staff, mejora experiencia del huésped
- **Para InnPilot**: Diferenciador competitivo, producto core con valor recurrente

### Infraestructura Existente ✅
```
✅ guest_reservations (8 huéspedes activos)
✅ chat_conversations (4 conversaciones iniciadas)
✅ chat_messages (tabla lista, 0 mensajes)
✅ Embeddings Matryoshka (accommodation + MUVA tourism)
✅ Multi-tenant architecture
```

### Timeline Estimado
- **Fase 1 (Core)**: 2-3 semanas
- **Fase 2 (UX)**: 1-2 semanas
- **Fase 3 (Intelligence)**: 2-3 semanas
- **Total**: 5-8 semanas

---

## 🎯 FASE 1: Core Conversacional (Semanas 1-3)

> **Objetivo**: Sistema funcional mínimo para que huéspedes puedan autenticarse y mantener conversaciones con contexto

### 1.1 Guest Authentication System

#### Backend API
**Archivo**: `/src/app/api/guest/login/route.ts`

```typescript
POST /api/guest/login
Body: {
  tenant_id: string
  check_in_date: string  // "YYYY-MM-DD"
  phone_last_4: string   // "1234"
}

Response: {
  success: boolean
  token: string  // JWT
  conversation_id: string
  guest_info: {
    name: string
    check_in: string
    check_out: string
    reservation_code: string
  }
}
```

**Flujo de autenticación**:
1. Validar `check_in_date` + `phone_last_4` contra `guest_reservations`
2. Si existe reserva activa → Buscar/crear `chat_conversation`
3. Generar JWT con payload: `{reservation_id, conversation_id, tenant_id}`
4. Retornar token + información de la conversación

**Tareas**:
- [ ] Crear endpoint `/api/guest/login`
- [ ] Implementar validación de credenciales
- [ ] Generar JWT tokens (usar `jose` library)
- [ ] Manejar casos edge (reserva expirada, múltiples reservas)
- [ ] Tests unitarios

#### Auth Library
**Archivo**: `/src/lib/guest-auth.ts`

```typescript
export interface GuestSession {
  reservation_id: string
  conversation_id: string
  tenant_id: string
  guest_name: string
  check_in: Date
  check_out: Date
}

export async function authenticateGuest(
  checkInDate: string,
  phoneLast4: string,
  tenantId: string
): Promise<GuestSession | null>

export function generateGuestToken(session: GuestSession): string

export function verifyGuestToken(token: string): GuestSession | null

export function isTokenExpired(session: GuestSession): boolean
```

**Tareas**:
- [ ] Crear funciones de autenticación
- [ ] Implementar JWT signing/verification
- [ ] Agregar validación de expiración
- [ ] Tests de seguridad

---

### 1.2 Conversational Chat Engine

#### Main Chat API
**Archivo**: `/src/app/api/guest/chat/route.ts`

```typescript
POST /api/guest/chat
Headers: { Authorization: "Bearer <jwt_token>" }
Body: {
  query: string
  include_history?: boolean  // Default: true
}

Response: {
  success: boolean
  response: string
  entities: string[]
  follow_up_suggestions: string[]
  sources: SourceMetadata[]
  metrics: {
    response_time: number
    tokens_used: number
    cost: number
  }
}
```

**Flujo del engine**:
```
1. DECODE TOKEN → Get conversation_id + guest context
                    ↓
2. LOAD HISTORY → Last 10 messages from chat_messages
                    ↓
3. EXTRACT ENTITIES → ["Blue Life Dive", "buceo"]
                    ↓
4. ENHANCE QUERY → LLM expands: "¿cuánto cuesta?"
                   → "¿cuánto cuesta certificación Blue Life Dive?"
                    ↓
5. VECTOR SEARCH → accommodation_units + muva_content
                   → Boost by entities from context
                    ↓
6. RETRIEVE FULL DOCS → When confidence > 0.7, load complete document
                    ↓
7. LLM RESPONSE → Claude Sonnet 3.5 with:
                  - Query + enhanced context
                  - Vector results (full docs)
                  - Conversation history
                  - Guest personalization
                    ↓
8. PERSIST MESSAGES → Save user + assistant to chat_messages
                      → Update metadata (entities, sources, metrics)
                    ↓
9. RETURN RESPONSE → Natural language + follow-ups
```

**Tareas**:
- [ ] Crear endpoint `/api/guest/chat`
- [ ] Implementar autenticación con JWT
- [ ] Integrar conversational engine
- [ ] Agregar rate limiting
- [ ] Error handling robusto
- [ ] Tests de integración

#### Conversational Engine Core
**Archivo**: `/src/lib/conversational-chat-engine.ts`

```typescript
export interface ConversationalContext {
  query: string
  history: ChatMessage[]
  guestInfo: GuestSession
  vectorResults: VectorSearchResult[]
}

export interface ConversationalResponse {
  response: string
  entities: string[]
  followUpSuggestions: string[]
  sources: SourceMetadata[]
  confidence: number
}

export async function generateConversationalResponse(
  context: ConversationalContext
): Promise<ConversationalResponse>

// Sub-functions
async function loadConversationHistory(conversationId: string): Promise<ChatMessage[]>
function extractEntities(history: ChatMessage[]): string[]
async function enhanceQueryWithContext(query: string, entities: string[]): Promise<string>
async function performContextAwareSearch(query: string, entities: string[]): Promise<VectorSearchResult[]>
async function retrieveFullDocument(sourceFile: string, table: string): Promise<DocumentContent>
async function generateResponseWithClaude(context: ConversationalContext): Promise<string>
function generateFollowUpSuggestions(response: string, entities: string[]): string[]
```

**Features clave**:
- **Entity tracking**: Mantener lista de entidades mencionadas (lugares, actividades)
- **Context-aware search**: Boost resultados que matchean entities previos
- **Full document retrieval**: Cargar documento completo cuando confidence > 0.7
- **Personalization**: Usar `guest_name`, `check_in_date` en respuestas
- **Follow-up generation**: Sugerir preguntas relevantes basadas en contexto

**Tareas**:
- [ ] Implementar engine principal
- [ ] Context retrieval (history + entities)
- [ ] Query enhancement con LLM
- [ ] Vector search con entity boosting
- [ ] Full document retrieval function
- [ ] Claude Sonnet 3.5 integration
- [ ] Follow-up suggestions generator
- [ ] Tests unitarios para cada función

#### Context Enhancement
**Archivo**: `/src/lib/context-enhancer.ts`

```typescript
export interface EnhancedQuery {
  original: string
  enhanced: string
  entities: string[]
  isFollowUp: boolean
  confidence: number
}

export async function enhanceQuery(
  query: string,
  conversationHistory: ChatMessage[]
): Promise<EnhancedQuery>

// Usa Claude Haiku (rápido) para expandir queries ambiguas
// "¿cuánto cuesta?" + history[entities: "Blue Life Dive"]
// → "¿cuánto cuesta la certificación de buceo en Blue Life Dive?"
```

**Tareas**:
- [ ] Implementar detección de follow-ups
- [ ] Query expansion con Claude Haiku
- [ ] Entity extraction de historial
- [ ] Confidence scoring

---

### 1.3 Persistence & Database

#### Message Metadata Schema
**Actualizar**: `chat_messages.metadata` (ya existe como JSONB)

```json
{
  "entities": ["Blue Life Dive", "buceo PADI", "certificación"],
  "sources": [
    {
      "type": "tourism",
      "table": "muva_content",
      "source_file": "blue-life-dive.md",
      "similarity": 0.89,
      "chunks_used": [1, 2, 5]
    }
  ],
  "intent": {
    "type": "tourism",
    "confidence": 0.95,
    "reasoning": "User asking about diving activities"
  },
  "metrics": {
    "response_time_ms": 2341,
    "token_count_input": 450,
    "token_count_output": 320,
    "cost_usd": 0.00012,
    "model": "claude-sonnet-3.5"
  },
  "follow_up_suggestions": [
    "¿Cuánto cuesta el curso avanzado?",
    "¿Tienen descuentos grupales?",
    "¿Cómo hago la reserva?"
  ],
  "full_document_retrieved": true,
  "context_entities_used": ["Blue Life Dive"],
  "is_follow_up": false
}
```

**Tareas**:
- [ ] Documentar schema de metadata
- [ ] Crear funciones helper para leer/escribir metadata
- [ ] Validación de estructura

**🤖 Database Agent Responsibilities**:
- [ ] Database agent: Monitorear metadata integrity post-implementation
- [ ] Database agent: Validar que metadata JSONB nunca sea NULL
- [ ] Database agent: Alert si metadata quality < 95%

#### Database Migrations
**Archivo**: `supabase/migrations/add_guest_chat_indexes.sql`

```sql
-- Performance indexes para conversational chat
CREATE INDEX idx_chat_messages_conversation_created
  ON chat_messages(conversation_id, created_at DESC);

CREATE INDEX idx_chat_messages_metadata_entities
  ON chat_messages USING GIN ((metadata->'entities'));

CREATE INDEX idx_chat_conversations_reservation
  ON chat_conversations(reservation_id)
  WHERE status = 'active';

CREATE INDEX idx_guest_reservations_auth
  ON guest_reservations(check_in_date, phone_last_4, tenant_id)
  WHERE status = 'active';
```

**Archivo**: `supabase/migrations/add_guest_chat_rls.sql`

```sql
-- Row Level Security para guest chat

-- Guests solo ven sus propias conversaciones
CREATE POLICY guest_own_conversations ON chat_conversations
  FOR SELECT
  USING (
    user_id = current_setting('app.current_user_id')::uuid
    AND user_type = 'guest'
  );

-- Guests solo ven mensajes de sus conversaciones
CREATE POLICY guest_own_messages ON chat_messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM chat_conversations
      WHERE user_id = current_setting('app.current_user_id')::uuid
    )
  );

-- Staff puede ver todas las conversaciones de su tenant
CREATE POLICY staff_tenant_conversations ON chat_conversations
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id')
    AND (
      current_setting('app.user_role') IN ('staff', 'admin', 'owner')
    )
  );
```

**Tareas**:
- [ ] Crear migration de indexes
- [ ] Crear migration de RLS policies
- [ ] Testear policies con diferentes roles
- [ ] Documentar permisos

**🤖 Database Agent Responsibilities**:
- [ ] Database agent: Validar creación exitosa de todos los indexes
- [ ] Database agent: Verificar RLS policies funcionando correctamente
- [ ] Database agent: Monitorear index usage post-deployment
- [ ] Database agent: Performance baseline establecido (<50ms message retrieval)

#### Full Document Retrieval
**Archivo**: `supabase/migrations/add_get_full_document_function.sql`

```sql
CREATE OR REPLACE FUNCTION get_full_document(
  p_source_file VARCHAR,
  p_table_name VARCHAR
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  title VARCHAR,
  description TEXT,
  business_info JSONB,
  full_content TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Retorna todos los chunks del mismo source_file
  -- Ordenados por chunk_index
  -- Con full_content = string_agg de todos los chunks

  IF p_table_name = 'muva_content' THEN
    RETURN QUERY
    SELECT
      mc.id,
      mc.content,
      mc.title,
      mc.description,
      mc.business_info,
      string_agg(mc.content, E'\n\n' ORDER BY mc.chunk_index)
        OVER (PARTITION BY mc.source_file) as full_content
    FROM muva_content mc
    WHERE mc.source_file = p_source_file
    ORDER BY mc.chunk_index;
  ELSIF p_table_name = 'accommodation_units' THEN
    -- Similar para accommodation_units
    RETURN QUERY
    SELECT
      au.id,
      au.description as content,
      au.name as title,
      au.short_description as description,
      NULL::JSONB as business_info,
      au.description as full_content
    FROM accommodation_units au
    WHERE au.id = p_source_file::UUID;
  END IF;
END;
$$;
```

**Tareas**:
- [ ] Crear función SQL
- [ ] Tests de performance
- [ ] Integrar en conversational engine

**🤖 Database Agent Responsibilities**:
- [ ] Database agent: Test de función get_full_document con muva_content
- [ ] Database agent: Validar performance <100ms para document retrieval
- [ ] Database agent: Monitorear uso de función en producción

---

### 1.4 Frontend - Guest Interface

#### Guest Login Screen
**Archivo**: `/src/components/Chat/GuestLogin.tsx`

```typescript
interface GuestLoginProps {
  tenantId: string
  onLoginSuccess: (session: GuestSession) => void
}

export function GuestLogin({ tenantId, onLoginSuccess }: GuestLoginProps) {
  // Form: check_in_date (date picker) + phone_last_4 (4 digits)
  // Validaciones: fecha válida, 4 dígitos numéricos
  // Submit → POST /api/guest/login
  // Success → Store JWT, call onLoginSuccess
  // Error → Mostrar mensaje (reserva no encontrada)
}
```

**Features**:
- Date picker mobile-friendly
- Input mask para teléfono (solo 4 dígitos)
- Validación en tiempo real
- Loading states
- Error messages claros
- Soporte multi-idioma (ES/EN)

**🎨 UX-Interface Agent - FULL OWNERSHIP**:
- [ ] UX Agent: Crear componente GuestLogin completo
- [ ] UX Agent: UI/UX mobile-first (320-768px)
- [ ] UX Agent: Date picker visual + phone input con mask
- [ ] UX Agent: Validaciones en tiempo real
- [ ] UX Agent: Loading states elegantes
- [ ] UX Agent: Error messages claros y accionables
- [ ] UX Agent: Multi-idioma (ES/EN)
- [ ] UX Agent: Tests E2E con Playwright

**Backend Dev (Solo API Integration)**:
- [ ] POST /api/guest/login endpoint (backend)
- [ ] JWT generation (backend)

#### Guest Chat Interface
**Archivo**: `/src/components/Chat/GuestChatInterface.tsx`

```typescript
interface GuestChatInterfaceProps {
  session: GuestSession
  onLogout: () => void
}

export function GuestChatInterface({ session, onLogout }: GuestChatInterfaceProps) {
  // Header: Guest name, check-in/out dates, logout
  // Messages: Load history on mount, display with roles
  // Entity badges: "Hablando sobre: Blue Life Dive 🤿"
  // Input: Text area + send button
  // Follow-ups: Clickable chips debajo de assistant messages
  // Mobile optimized: Bottom input, auto-scroll
}
```

**Features UI**:
- **Header**:
  - Nombre del huésped
  - Fechas de estadía
  - Botón de logout
- **Context Display**:
  - Badges de entidades activas
  - Indicador de tema conversacional
- **Message Display**:
  - User messages (derecha, azul)
  - Assistant messages (izquierda, blanco)
  - Timestamps
  - Loading indicators
- **Input Area**:
  - Auto-expand textarea
  - Character counter
  - Send button (disabled cuando loading)
  - Mobile keyboard optimization
- **Follow-up Suggestions**:
  - Chips clickables
  - Aparecen después de cada respuesta
  - Se actualizan con contexto
- **Persistence**:
  - Load full history on mount
  - Scroll to bottom automático
  - Mantener posición en scroll manual

**🎨 UX-Interface Agent - FULL OWNERSHIP**:
- [ ] UX Agent: GuestChatInterface completo con todas las features
- [ ] UX Agent: Message display (user derecha, assistant izquierda)
- [ ] UX Agent: Entity badges con animaciones
- [ ] UX Agent: Follow-up suggestion chips clickables
- [ ] UX Agent: Input area auto-expand con keyboard handling
- [ ] UX Agent: History loading con skeleton screens
- [ ] UX Agent: Mobile optimization (sticky bottom input)
- [ ] UX Agent: Scroll behavior (auto-bottom, preservación)
- [ ] UX Agent: Typing indicators animados
- [ ] UX Agent: Loading/error states
- [ ] UX Agent: Accessibility (ARIA, keyboard nav)
- [ ] UX Agent: Tests E2E completos

**Backend Dev (Solo API Integration)**:
- [ ] POST /api/guest/chat endpoint (backend)
- [ ] GET /api/guest/chat/history endpoint (backend)
- [ ] Message persistence (backend)

#### Routing & Page
**Archivo**: `/src/app/guest-chat/[tenant_id]/page.tsx`

```typescript
export default function GuestChatPage({ params }: { params: { tenant_id: string } }) {
  const [session, setSession] = useState<GuestSession | null>(null)

  if (!session) {
    return <GuestLogin tenantId={params.tenant_id} onLoginSuccess={setSession} />
  }

  return <GuestChatInterface session={session} onLogout={() => setSession(null)} />
}
```

**URL structure**: `/guest-chat/simmerdown`

**Backend Dev (Page Routing Only)**:
- [ ] Backend: Crear page route `/guest-chat/[tenant_id]/page.tsx`
- [ ] Backend: Session state management
- [ ] Backend: SEO metadata

**Note**: UX Agent maneja los componentes visuales (GuestLogin, GuestChatInterface)

---

### 1.5 Testing & Validation

#### Unit Tests (Backend Dev)
- [ ] Backend: `guest-auth.ts` - Autenticación, JWT generation/verification
- [ ] Backend: `conversational-chat-engine.ts` - Entity extraction, query enhancement
- [ ] Backend: `context-enhancer.ts` - Follow-up detection, query expansion
- [ ] Backend: Coverage target >80%

#### Integration Tests (Backend Dev)
- [ ] Backend: `/api/guest/login` - Happy path, error cases
- [ ] Backend: `/api/guest/chat` - Full conversational flow
- [ ] Backend: Database functions - Full document retrieval
- [ ] Backend: Coverage target >70%

#### E2E Tests (UX Agent)
- [ ] UX Agent: Guest login flow completo (Playwright)
- [ ] UX Agent: Send message + receive response
- [ ] UX Agent: Follow-up conversation con context preservation
- [ ] UX Agent: Error scenarios (invalid credentials, network errors)
- [ ] UX Agent: Mobile device testing

#### Database Validation (Database Agent)
- [ ] Database Agent: Validar performance de history queries (<50ms)
- [ ] Database Agent: Verificar metadata integrity (NULL < 5%)
- [ ] Database Agent: Monitor index usage (>80% utilization)
- [ ] Database Agent: Alert setup para anomalías

**Setup**:
- [ ] Backend: Jest configuration para unit tests
- [ ] Backend: Supertest setup para integration tests
- [ ] UX Agent: Playwright configuration para E2E tests
- [ ] DevOps: CI/CD integration (GitHub Actions)
- [ ] CI/CD integration

---

## 🚀 FASE 2: Enhanced UX (Semanas 4-5)

> **Objetivo**: Mejorar la experiencia del usuario con features avanzadas
> **⚡ UX-Interface Agent es responsable completo de FASE 2**

### 2.1 Follow-up Suggestion System

**Mejoras**:
- Generar follow-ups dinámicos basados en:
  - Entities mencionadas
  - Información no cubierta en respuesta
  - Preguntas comunes del tenant
- Tracking de click-through rate
- A/B testing de diferentes formatos

**🎨 UX Agent Ownership**:
- [ ] UX Agent: Algoritmo mejorado de generación de follow-ups
- [ ] UX Agent: UI variations A/B testing
- [ ] UX Agent: Visual feedback de click-through rates
- [ ] Backend: Analytics tracking de follow-up clicks

### 2.2 Entity Tracking Display

**Visual improvements**:
- Badges animados cuando se detecta nueva entidad
- Timeline de entidades (qué se habló cuándo)
- Quick jump a mensajes relacionados
- Clear context button (limpiar entidades)

**🎨 UX Agent - Full Ownership**:
- [ ] UX Agent: Entity badges animados con entrada staggered
- [ ] UX Agent: Timeline visual de entidades
- [ ] UX Agent: Quick jump a mensajes relacionados
- [ ] UX Agent: Clear context button con animación
- [ ] UX Agent: Hover effects y tooltips

### 2.3 Mobile Optimization

**Mejoras específicas móvil**:
- Voice input (Web Speech API)
- Pull-to-refresh history
- Offline mode (cache últimos mensajes)
- Push notifications (nuevos mensajes de staff)
- Share conversation (screenshot/link)

**🎨 UX Agent - Full Ownership**:
- [ ] UX Agent: Voice input UI (Web Speech API)
- [ ] UX Agent: Pull-to-refresh gesture y animación
- [ ] UX Agent: Offline mode UI (Service Workers)
- [ ] UX Agent: Share conversation UI (screenshot/link)
- [ ] UX Agent: PWA manifest y setup completo
- [ ] Backend: Push notifications backend
- [ ] Backend: Service Worker caching strategy

### 2.4 Rich Media Support

**Features**:
- Image understanding (adjuntar fotos de menú, mapa)
- Display de imágenes en respuestas (galerías de actividades)
- Location sharing (mostrar en mapa)
- PDF/document preview

**🎨 UX Agent - Frontend**:
- [ ] UX Agent: Image upload UI component
- [ ] UX Agent: Gallery display component con lazy loading
- [ ] UX Agent: Map integration UI (location display)
- [ ] UX Agent: PDF/document preview component
- [ ] UX Agent: Drag-and-drop file upload

**Backend Integration**:
- [ ] Backend: Claude Vision API integration
- [ ] Backend: Supabase storage para imágenes
- [ ] Backend: Image processing y optimization

---

## 🧠 FASE 3: Intelligence & Integration (Semanas 6-8)

> **Objetivo**: Sistema inteligente que anticipa necesidades y se integra con otros servicios

### 3.1 Proactive Recommendations

**Features**:
- Welcome message personalizado al check-in
- Recordatorios contextuales:
  - "Mañana es tu último día, ¿quieres recomendaciones?"
  - "¿Reservaste actividades para hoy?"
- Weather-aware suggestions
- Event notifications (conciertos, festivales locales)

**Tareas**:
- [ ] Proactive trigger system
- [ ] Welcome message generator
- [ ] Contextual reminders
- [ ] External data integration (weather, events)

### 3.2 Booking Integration

**Features**:
- Reservar actividades turísticas desde chat
- Ver availability de tours
- Confirmar booking con un click
- Integración con calendarios

**Tareas**:
- [ ] Booking intent detection
- [ ] MUVA providers API integration
- [ ] Reservation flow in chat
- [ ] Calendar integration
- [ ] Confirmation emails

### 3.3 Multi-language Support

**Features**:
- Auto-detect guest language (Spanish/English)
- Translate responses on-the-fly
- Maintain context across languages
- Language preference storage

**Tareas**:
- [ ] Language detection
- [ ] Translation layer (Claude multilingual)
- [ ] UI i18n
- [ ] Preference storage

### 3.4 Staff Dashboard

**Features para staff**:
- Ver conversaciones activas
- Intervenir en chat (staff override)
- Analytics de queries comunes
- Feedback collection (thumbs up/down)
- Guest satisfaction metrics

**🎨 UX Agent - Frontend**:
- [ ] UX Agent: Staff dashboard UI completo
- [ ] UX Agent: Conversation list con filtros
- [ ] UX Agent: Real-time monitor interface
- [ ] UX Agent: Analytics dashboard visual
- [ ] UX Agent: Feedback collection UI

**🤖 Database Agent - Monitoring**:
- [ ] Database Agent: Real-time conversation tracking queries
- [ ] Database Agent: Analytics data aggregation
- [ ] Database Agent: Performance monitoring del dashboard

**Backend Integration**:
- [ ] Backend: Staff override/intervention system
- [ ] Backend: Human handoff logic
- [ ] Backend: Analytics APIs

---

## 📊 Especificaciones Técnicas

### Modelo LLM: Claude Sonnet 3.5

**Por qué Sonnet (no Haiku)**:
- ✅ Razonamiento superior para recomendaciones complejas
- ✅ Contexto 200K tokens (conversaciones largas)
- ✅ Mejor comprensión de follow-ups y contexto
- ✅ Respuestas más naturales, empáticas y personalizadas
- ✅ Vision capabilities (Fase 2)

**Uso de Haiku**:
- Intent detection rápido (ya implementado)
- Query enhancement simple
- Queries de staff/admin

**Costos proyectados**:
```
Claude Sonnet 3.5:
- Input: $3/M tokens
- Output: $15/M tokens

Promedio por query:
- Input: ~500 tokens (query + history + results)
- Output: ~300 tokens (response)
- Costo: $0.006/query

Proyección por tenant:
- 100 queries/día → $0.60/día
- 3,000 queries/mes → $18/mes
- Con 10 tenants → $180/mes

ROI: Asumiendo cada tenant paga $100+/mes por la plataforma,
     el costo de LLM es ~18% del revenue (muy razonable)
```

### Database Schema

#### Tablas Existentes (No cambios)
```sql
guest_reservations (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR,
  guest_name VARCHAR,
  phone_full VARCHAR,
  phone_last_4 VARCHAR,
  check_in_date DATE,
  check_out_date DATE,
  reservation_code VARCHAR UNIQUE,
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
)

chat_conversations (
  id UUID PRIMARY KEY,
  user_id VARCHAR,
  user_type VARCHAR CHECK (user_type IN ('guest', 'staff', 'admin')),
  reservation_id UUID REFERENCES guest_reservations(id),
  tenant_id VARCHAR,
  status VARCHAR CHECK (status IN ('active', 'archived')),
  guest_phone_last_4 VARCHAR,
  check_in_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

chat_messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES chat_conversations(id),
  role VARCHAR CHECK (role IN ('user', 'assistant')),
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
)
```

### API Contracts

#### Authentication
```typescript
POST /api/guest/login
Request: {
  tenant_id: string
  check_in_date: string  // YYYY-MM-DD
  phone_last_4: string   // 4 digits
}

Response: {
  success: boolean
  token?: string
  conversation_id?: string
  guest_info?: {
    name: string
    check_in: string
    check_out: string
    reservation_code: string
  }
  error?: string
}
```

#### Chat
```typescript
POST /api/guest/chat
Headers: {
  Authorization: "Bearer <jwt_token>"
}
Request: {
  query: string
  include_history?: boolean  // default: true
}

Response: {
  success: boolean
  response: string
  entities: string[]
  follow_up_suggestions: string[]
  sources: Array<{
    type: 'accommodation' | 'tourism'
    file: string
    similarity: number
    title?: string
  }>
  metrics: {
    response_time: number
    tokens_used: number
    cost: number
  }
  error?: string
}
```

#### Conversation History
```typescript
GET /api/guest/conversation/:conversation_id
Headers: {
  Authorization: "Bearer <jwt_token>"
}
Query: {
  limit?: number  // default: 50
  offset?: number  // default: 0
}

Response: {
  success: boolean
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    metadata: object
    created_at: string
  }>
  has_more: boolean
  total_count: number
}
```

### Security & Privacy

#### Authentication
- JWT tokens con expiración de 7 días
- Refresh token no implementado en v1 (re-login con credenciales)
- Tokens incluyen: `{reservation_id, conversation_id, tenant_id, exp}`

#### Row Level Security
- Guests solo ven sus conversaciones
- Staff ve conversaciones de su tenant
- Admin ve todo
- Policies implementadas en Postgres RLS

#### Data Privacy
- Datos de conversación linked a reservation
- Auto-archive después de check-out + 30 días
- Cumplimiento GDPR: Right to deletion

### Performance Targets

| Métrica | Target | Actual |
|---------|--------|--------|
| Guest login | < 500ms | TBD |
| Chat response | < 3s | TBD |
| History load | < 200ms | TBD |
| Vector search | < 100ms | ✅ 50ms (tier 1) |
| Full doc retrieval | < 300ms | TBD |
| Claude Sonnet | < 2s | TBD |

---

## 🔧 Guía de Implementación

### Setup Local

```bash
# 1. Environment variables
cp .env.example .env.local

# Agregar:
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=random-secret-key-here
GUEST_TOKEN_EXPIRY=7d

# 2. Database migrations
npm run db:migrate

# 3. Seed test data (opcional)
npm run db:seed:guests

# 4. Run development server
npm run dev

# 5. Test guest login
curl -X POST http://localhost:3000/api/guest/login \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "simmerdown",
    "check_in_date": "2025-10-01",
    "phone_last_4": "0011"
  }'
```

### Testing Strategy

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage

# Watch mode durante desarrollo
npm run test:watch
```

### Deployment Checklist

**Pre-deployment**:
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies tested
- [ ] Performance benchmarks met
- [ ] Security audit completed

**Deployment**:
- [ ] Deploy migrations first
- [ ] Deploy backend (API routes)
- [ ] Deploy frontend (components)
- [ ] Smoke tests en staging
- [ ] Gradual rollout (10% → 50% → 100%)

**Post-deployment**:
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify conversation flow
- [ ] Collect initial user feedback
- [ ] Cost monitoring (LLM usage)

---

## 📈 Success Metrics

### Technical KPIs
- **Response time**: < 3s p95
- **Error rate**: < 1%
- **Uptime**: > 99.5%
- **Cost per conversation**: < $0.10

### Product KPIs
- **Guest adoption rate**: > 50% of reservations
- **Messages per conversation**: > 5
- **Conversation length**: > 3 days
- **Follow-up click rate**: > 30%
- **Guest satisfaction**: > 4.5/5

### Business KPIs
- **Reduced staff inquiries**: -40%
- **Booking conversion** (Fase 3): +20%
- **Guest retention**: +15%
- **NPS improvement**: +10 points

---

## 🚨 Risks & Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Claude API downtime | Alto | Baja | Fallback a respuestas cacheadas + error gracioso |
| Token costs exceden presupuesto | Medio | Media | Rate limiting, caching, modelo más barato para queries simples |
| Slow vector search | Alto | Baja | Ya optimizado con Matryoshka, monitores de performance |
| Context overflow (>200K tokens) | Medio | Baja | Truncar historia a últimos 20 mensajes, summarization |

### Product Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Guests no adoptan el sistema | Alto | Media | Onboarding claro, prompts sugeridos, demos |
| Respuestas inexactas o confusas | Alto | Media | Extensive testing, feedback loop, human-in-the-loop |
| Privacy concerns | Alto | Baja | Clear data policies, compliance, opt-out option |
| Spam/abuse | Medio | Media | Rate limiting, tenant monitoring, block functionality |

---

## 📚 Referencias

### Documentación Técnica
- [Claude Sonnet API](https://docs.anthropic.com/claude/docs/models-overview)
- [Embeddings Matryoshka](./docs/PREMIUM_CHAT_ARCHITECTURE.md)
- [Multi-tenant Architecture](./docs/ARCHITECTURE.md)
- [MUVA Listings](./docs/MUVA_LISTINGS_GUIDE.md)

### Ejemplos de Implementación
- [Premium Chat DEV](./src/app/api/premium-chat-dev/route.ts) - Base actual
- [Intent Detection](./src/lib/premium-chat-intent.ts) - Claude Haiku integration
- [Token Counter](./src/lib/token-counter.ts) - Cost tracking

---

## ✅ Decisiones Clave

1. **Claude Sonnet 3.5** (no Haiku) → Razonamiento > Velocidad
2. **Contexto persistente por reserva** → No sesiones temporales
3. **Full document retrieval** cuando confidence > 0.7 → Contenido completo
4. **Entity tracking** a través de conversación → Memoria de largo plazo
5. **Multi-tenant isolation** vía RLS → Seguridad by design
6. **Guest authentication simple** → Check-in date + phone → Balance seguridad/UX
7. **Mobile-first design** → Huéspedes usan móviles primariamente
8. **Incremental rollout** → Fase 1 (core) → Fase 2 (UX) → Fase 3 (intelligence)

---

**Última revisión**: 30 de Septiembre 2025
**Responsable**: Equipo InnPilot
**Estado**: ✅ Aprobado para desarrollo
