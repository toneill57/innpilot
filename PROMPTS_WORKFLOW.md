# Workflow de Prompts - Sistema 3 Chats Multi-Nivel

**Plan Principal**: [plan.md](./plan.md)
**Lista de Tareas**: [TODO.md](./TODO.md)
**Fecha**: Octubre 1, 2025

---

## 📋 Cómo Usar Este Documento

Cada FASE tiene un **prompt optimizado** listo para copy-paste en una **nueva sesión de Claude Code**.

**Workflow recomendado**:
1. Copiar el prompt de la FASE actual
2. Abrir nueva sesión de Claude Code
3. Pegar el prompt completo
4. Dejar que los agentes especializados trabajen
5. Validar resultados antes de pasar a siguiente FASE

**Importante**:
- Cada prompt incluye TODO el contexto necesario
- Los agentes tienen acceso a plan.md y TODO.md automáticamente
- Los prompts usan delegación de agentes (backend-developer, database-agent, ux-interface)
- Seguir orden secuencial: FASE A → FASE B → FASE C

---

## 🔧 FASE A: Staff Chat System

**Timeline**: 3-4 semanas | **Tareas**: 65

### Prompt FASE A - Semana 1-2: Backend + Database

```
Lee el archivo plan.md sección "FASE A: Staff Chat System" (líneas 128-1107).

Implementa el sistema completo de Staff Chat siguiendo estos pasos:

1. BACKEND DEVELOPER (@backend-developer):
   - Crear src/lib/staff-auth.ts con authenticateStaff(), generateStaffToken(), verifyStaffToken()
   - Crear src/app/api/staff/login/route.ts (POST endpoint con validación)
   - Crear src/app/api/staff/chat/route.ts (POST endpoint con Bearer auth)
   - Crear src/app/api/staff/chat/history/route.ts (GET endpoint con paginación)
   - Crear src/lib/staff-chat-engine.ts con generateStaffChatResponse()
   - Implementar performStaffSearch() con role-based filtering (CEO > Admin > Housekeeper)
   - Usar Matryoshka Tier 2 (embedding_balanced vector(1536)) para hotel_operations y SIRE
   - Guardar conversaciones en staff_conversations + staff_messages

2. DATABASE AGENT (@database-agent):
   - Crear migration: add_staff_users_table.sql
     - staff_id, tenant_id, role, username, password_hash, permissions JSONB
     - Indexes: tenant, username, role
     - RLS policies: staff_own_profile, staff_admin_view_all
   - Crear migration: add_hotel_operations_table.sql
     - operation_id, tenant_id, category, title, content
     - embedding vector(3072), embedding_balanced vector(1536)
     - HNSW index en embedding_balanced
     - RLS policy con access_level filtering (all_staff | admin_only | ceo_only)
   - Crear migration: add_staff_conversations_tables.sql
     - staff_conversations (conversation_id, staff_id, tenant_id, category, status)
     - staff_messages (message_id, conversation_id, message_index, role, content, metadata JSONB)
   - Seedear 3 usuarios de prueba (CEO, Admin, Housekeeper) para Simmer Down
   - Seedear 10 documentos hotel_operations con embeddings

3. VALIDACIÓN:
   - Ejecutar tests: npm test -- src/lib/__tests__/staff-auth.test.ts
   - Verificar indexes con: SELECT * FROM pg_indexes WHERE tablename IN ('staff_users', 'hotel_operations', 'staff_conversations', 'staff_messages')
   - Verificar RLS policies funcionan correctamente
   - Test manual: Autenticar CEO → query SIRE → success
   - Test manual: Autenticar Housekeeper → query admin content → permission denied

4. ENTREGABLES:
   - 7 archivos backend (.ts)
   - 3 migrations (.sql)
   - 2 seed scripts (.sql)
   - 15+ unit tests passing
   - docs/backend/STAFF_CHAT_MONITORING.md con queries de monitoreo

Ver plan.md líneas 128-1107 para especificaciones completas de código, schemas SQL, y API contracts.

IMPORTANTE: Usar bcrypt para password_hash, JWT con 24h expiry, validar tenant.features.staff_chat_enabled antes de permitir login.
```

---

### Prompt FASE A - Semana 3-4: Frontend + Testing

```
Lee el archivo plan.md sección "FASE A: Staff Chat System" (líneas 128-1107), subsección "UI Components - Staff Chat" (líneas 928-1006).

Implementa el frontend completo de Staff Chat:

1. UX INTERFACE (@ux-interface):
   - Crear src/components/Staff/StaffLogin.tsx
     - Layout: Tenant selector + Username + Password + "Remember me"
     - Validación: Required fields, error messages
     - Submit: POST /api/staff/login → guardar JWT → redirect
     - Loading state durante autenticación
     - Error handling con retry button

   - Crear src/components/Staff/StaffChatInterface.tsx
     - Layout: Sidebar (20%) + Chat area (80%)
     - Sidebar: Conversation list con "New conversation" button
     - Sidebar: Filter por category (SIRE, Operations, Admin)
     - Header: Staff name + role badge (CEO/Admin/Housekeeper) + Logout
     - Chat area: Message list con user/assistant alternado
     - Chat area: Source attribution expandible
     - Chat area: Input field + send button
     - Animations: Smooth scroll, fade-in messages
     - Mobile responsive: Sidebar collapses

   - Crear src/components/Staff/ConversationList.tsx
     - Item: Título + preview último mensaje + timestamp
     - Item: Category badge
     - Empty state: "Start a new conversation"

   - Crear src/components/Staff/SourcesDrawer.tsx
     - Expandible drawer con fuentes
     - Source item: Tabla + similarity score + content preview
     - Copy content button

2. TESTING (@testing):
   - E2E tests: e2e/staff-chat.spec.ts (5 scenarios)
     1. CEO login → admin question → success
     2. Housekeeper login → admin question → permission denied
     3. Staff asks SIRE → correct docs returned
     4. Invalid credentials → login fails
     5. Token expiry → re-authentication required

   - Manual testing checklist (TODO.md líneas 1040-1049)

3. INTEGRACIÓN:
   - Agregar route /staff en app router
   - Conectar StaffLogin → StaffChatInterface
   - Implementar localStorage para JWT persistence
   - Implementar auto-logout en token expiry
   - Agregar link en dashboard para staff

4. ENTREGABLES:
   - 4 componentes UI (.tsx)
   - 1 E2E test suite (5 scenarios)
   - Estilos responsive (mobile + desktop)
   - Manual testing checklist completado

Ver plan.md líneas 928-1006 para layouts específicos y requirements de diseño.

IMPORTANTE: UI debe ser professional/admin aesthetic, NO usar colores tropicales (esto es para staff, no guests).
```

---

## 🌐 FASE B: Public/Pre-Reserva Chat

**Timeline**: 3-4 semanas | **Tareas**: 60

### Prompt FASE B - Semana 1-2: Backend + Database

```
Lee el archivo plan.md sección "FASE B: Public/Pre-Reserva Chat" (líneas 1109-1751).

Implementa el sistema completo de Public Chat para visitantes del sitio web:

1. BACKEND DEVELOPER (@backend-developer):
   - Crear src/lib/public-chat-session.ts
     - Interface PublicSession
     - Función getOrCreatePublicSession(sessionId?, tenantId, cookieId?)
     - Función updatePublicSession() con conversation_history (últimos 20)
     - Función extractTravelIntent(message) usando Claude Haiku para NLP
       - Extraer: check_in, check_out, guests, accommodation_type
       - Response en JSON
     - Función generateAvailabilityURL(baseURL, intent)
       - Generar: https://simmerdown.house/availability?check_in=...&check_out=...&guests=...

   - Crear src/lib/public-chat-search.ts
     - Función performPublicSearch(query, sessionInfo)
     - Función searchAccommodationsPublic() usando Tier 1 (embedding_fast)
     - Función searchPolicies() (public policies only)
     - Función searchMUVABasic() (highlights only, NO full content)
     - Filtrado: NO manual content, NO guest-only content

   - Crear src/lib/public-chat-engine.ts
     - Interface PublicChatResponse
     - Función generatePublicChatResponse(message, sessionId, tenantId)
     - Integrar extractTravelIntent() en cada mensaje
     - Generar availability_url si intent está completo
     - Generar 3 follow-up suggestions contextuales
     - System prompt: Marketing-focused, conversational, include CTAs
     - Guardar session en prospective_sessions

   - Crear src/app/api/public/chat/route.ts
     - POST endpoint (NO auth required)
     - Header X-Session-ID opcional
     - Request: { message, session_id?, tenant_id }
     - Response: { session_id, response, sources, travel_intent, availability_url?, suggestions }
     - Set cookie con session_id (expires: 7 days)
     - Rate limiting: 10 req/min por IP

2. DATABASE AGENT (@database-agent):
   - Crear migration: add_prospective_sessions_table.sql
     - session_id, tenant_id, cookie_id UNIQUE
     - conversation_history JSONB (array de mensajes)
     - travel_intent JSONB (check_in, check_out, guests, type, budget, preferences)
     - utm_tracking JSONB, referrer, landing_page
     - converted_to_reservation_id, conversion_date
     - created_at, expires_at DEFAULT NOW() + 7 days, status
     - Indexes: cookie_id, tenant, expires_at, intent (GIN)

   - Crear migration: add_accommodation_units_public_table.sql
     - unit_id, tenant_id, name, unit_type
     - description TEXT (marketing), short_description, highlights JSONB
     - amenities JSONB, pricing JSONB, photos JSONB
     - embedding vector(3072), embedding_fast vector(1024)
     - HNSW index en embedding_fast
     - RLS: Public read (no auth), is_active = true AND is_bookable = true

   - Crear migration: add_match_accommodations_public_function.sql
     - RPC function con query_embedding (1024d), tenant_id, threshold, count
     - Returns: id, content, similarity, pricing, photos, metadata

   - Migrar datos: accommodation_units → accommodation_units_public
     - Copiar marketing content (description, amenities, photos, pricing)
     - Copiar embeddings (embedding, embedding_fast)

   - Crear cron job: cleanup_expired_sessions.sql
     - DELETE FROM prospective_sessions WHERE status = 'active' AND expires_at < NOW()
     - Schedule: Daily at 3 AM

3. VALIDACIÓN:
   - Test: Session creation → conversation_history updates → expires after 7 days
   - Test: Intent extraction → "4 guests Dec 15-20" → extracts all fields
   - Test: URL generation → complete intent → valid URL
   - Test: Public search → NO manual content returned
   - Verificar HNSW index usage: EXPLAIN ANALYZE SELECT FROM match_accommodations_public()

4. ENTREGABLES:
   - 4 archivos backend (.ts)
   - 4 migrations (.sql)
   - 1 data migration script
   - 1 cron job script
   - docs/backend/PUBLIC_CHAT_MONITORING.md

Ver plan.md líneas 1109-1751 para especificaciones completas de NLP intent extraction y URL generation.

IMPORTANTE: Intent extraction usa Claude Haiku (barato + rápido). Public search usa Tier 1 (embedding_fast 1024d) para performance.
```

---

### Prompt FASE B - Semana 3-4: Frontend + Testing

```
Lee el archivo plan.md sección "FASE B: Public/Pre-Reserva Chat" (líneas 1109-1751), subsección "UI Components - Public Chat" (líneas 1679-1726).

Implementa el frontend de Public Chat con enfoque marketing:

1. UX INTERFACE (@ux-interface):
   - Crear src/components/Public/PublicChatBubble.tsx
     - Floating bubble (bottom-right, position: fixed)
     - Icon: Chat emoji con badge "Chat"
     - Smooth expand/collapse animation (scale + fade)
     - Z-index: 9999 (always on top)
     - Mobile: bottom-center con ajuste responsive

   - Crear src/components/Public/PublicChatInterface.tsx
     - Layout expandido: 400px × 600px (desktop), full-screen (mobile)
     - Header: "Simmer Down Chat" + Minimize + Close buttons
     - Chat area: Message list con scroll suave
     - Messages: User (right, blue) + Assistant (left, white)
     - Photo previews: Grid 2×2 para sources con fotos
     - Intent summary: Chip display "✈️ Dec 15-20 | 👥 4 guests"
     - CTA button: "Check Availability ✨" si availability_url presente
     - Input area: Text field + Send button (icon)
     - Follow-up chips: 3 suggestions clickables
     - Loading state: Typing indicator animado
     - Error handling: Retry button con mensaje amigable

   - Crear src/components/Public/IntentSummary.tsx
     - Display captured intent con icons
     - ✈️ Check-in/out dates
     - 👥 Number of guests
     - 🏠 Accommodation type
     - Edit button → permite cambiar intent

   - Crear src/components/Public/PhotoCarousel.tsx
     - Grid 2×2 de fotos de accommodations
     - Click para expandir en lightbox
     - Navigation arrows
     - Caption con unit name

   - Crear src/components/Public/AvailabilityCTA.tsx
     - Botón prominente "Ver Disponibilidad ✨"
     - Gradient background (tropical colors)
     - Link a availability_url
     - Track click event (analytics)
     - Disabled state si intent incompleto

2. ESTILO & ANIMACIONES:
   - Theme: Tropical vibes (teal, coral, yellow accents)
   - Typography: Friendly (Nunito or similar)
   - Animations:
     - Bubble expand: scale(0.8) → scale(1) con ease-out
     - Messages: fade-in + slide-up
     - Typing indicator: 3 dots bounce
     - Photo carousel: smooth transitions
   - Mobile-first: Touch-friendly, swipe gestures
   - Accessibility: ARIA labels, keyboard navigation

3. TESTING (@testing):
   - E2E tests: e2e/public-chat.spec.ts (5 scenarios)
     1. New visitor → first message → session created
     2. Intent capture → "4 guests Dec 15-20" → URL generated
     3. Accommodation inquiry → public info returned (NO manual)
     4. Session persistence → multiple messages → history maintained
     5. Mobile UX → bubble expand/collapse works

4. INTEGRACIÓN:
   - Embed PublicChatBubble en layout principal
   - Configurar session cookie persistence
   - Integrar Google Analytics event tracking
   - Configurar CORS para public API endpoint

5. ENTREGABLES:
   - 5 componentes UI (.tsx)
   - Estilos marketing-focused (tropical theme)
   - 1 E2E test suite (5 scenarios)
   - Mobile + desktop responsive
   - Analytics integration

Ver plan.md líneas 1679-1726 para layouts específicos y ejemplos de responses.

IMPORTANTE: Este chat es MARKETING-FOCUSED, debe ser atractivo visualmente y convertir visitantes en reservas. Usar tropical colors, fotos grandes, CTAs prominentes.
```

---

## 🔄 FASE C: Guest Chat Enhancement

**Timeline**: 1-2 semanas | **Tareas**: 30

### Prompt FASE C - Semana 1: Database Migration

```
Lee el archivo plan.md sección "FASE C: Guest Chat Enhancement" (líneas 1753-2124).

Implementa el split de accommodation data (public vs manual) para permitir re-booking:

1. DATABASE AGENT (@database-agent):
   - BACKUP CRÍTICO:
     - pg_dump accommodation_units → backup_accommodation_units_$(date).sql
     - Verificar backup completo antes de continuar

   - Crear migration: add_accommodation_units_manual_table.sql
     - unit_id PRIMARY KEY REFERENCES accommodation_units_public(unit_id)
     - manual_content TEXT (detailed manual)
     - detailed_instructions TEXT (appliances, AC, etc.)
     - house_rules_specific TEXT (unit-specific rules)
     - emergency_info TEXT (contacts, procedures)
     - wifi_password TEXT, safe_code TEXT
     - appliance_guides JSONB
     - local_tips TEXT ("Best coffee shop 2 blocks north")
     - embedding vector(3072), embedding_balanced vector(1536)
     - HNSW index en embedding_balanced

   - Crear migration: split_accommodation_units_data.sql
     - INSERT INTO accommodation_units_public
       - SELECT: id, tenant_id, name, unit_number, unit_type
       - content → description (marketing)
       - metadata->'amenities', metadata->'pricing', metadata->'photos'
       - embedding, embedding_fast
     - INSERT INTO accommodation_units_manual
       - SELECT: id (as unit_id)
       - metadata->>'manual_content'
       - metadata->>'instructions' → detailed_instructions
       - metadata->>'house_rules' → house_rules_specific
       - metadata->>'wifi_password'
       - embedding, embedding_balanced
     - VALIDAR: COUNT(public) = COUNT(manual) = COUNT(original)

   - Crear migration: add_match_guest_accommodations_function.sql
     - RPC function(query_embedding_fast, query_embedding_balanced, p_guest_unit_id, p_tenant_id, threshold, count)
     - RETURNS TABLE(id, content, similarity, source_table, is_guest_unit)
     - Query 1 (UNION): Search public (ALL units) usando embedding_fast
     - Query 2 (UNION): Search manual (ONLY guest's unit) usando embedding_balanced
     - Performance target: < 300ms

   - Re-generar embeddings:
     - Script: regenerate_accommodation_embeddings.sh
     - For each unit_public: node scripts/populate-embeddings.js → embedding + embedding_fast
     - For each unit_manual: node scripts/populate-embeddings.js → embedding + embedding_balanced

2. VALIDACIÓN:
   - Query: SELECT COUNT(*) FROM accommodation_units_public → debe = original count
   - Query: SELECT COUNT(*) FROM accommodation_units_manual → debe = original count
   - Test RPC: SELECT * FROM match_guest_accommodations(...) → verifica UNION funciona
   - EXPLAIN ANALYZE: Verificar HNSW index usage en ambas queries
   - Performance: Response time < 300ms (target)
   - Data integrity: Verificar NO hay unit_ids faltantes

3. ROLLBACK PLAN:
   - Si algo falla:
     - DROP TABLE accommodation_units_manual
     - DROP TABLE accommodation_units_public
     - Restaurar desde backup
   - Crear script: rollback_accommodation_split.sql

4. ENTREGABLES:
   - 4 migrations (.sql)
   - 1 backup script
   - 1 rollback script
   - 1 embedding regeneration script
   - docs/backend/GUEST_CHAT_ENHANCEMENT_VALIDATION.md

Ver plan.md líneas 1797-1929 para SQL completo de migration y RPC function.

IMPORTANTE: Este es un cambio CRÍTICO en schema. Hacer backup completo, validar en staging primero, tener rollback plan listo.
```

---

### Prompt FASE C - Semana 2: Backend Update + Testing

```
Lee el archivo plan.md sección "FASE C: Guest Chat Enhancement" (líneas 1753-2124), subsección "Backend Changes" (líneas 1931-2023).

Actualiza el Guest Chat engine para usar nuevo schema (public + manual):

1. BACKEND DEVELOPER (@backend-developer):
   - Actualizar src/lib/conversational-chat-engine.ts
     - Función performContextAwareSearch():
       - Cambiar searchAccommodation() → searchAccommodationEnhanced()
       - Generar 2 embeddings: fast (1024d) + balanced (1536d)
       - Pasar guest_unit_id a RPC function

     - Nueva función searchAccommodationEnhanced():
       - Llamar match_guest_accommodations(queryEmbeddingFast, queryEmbeddingBalanced, guestUnitId, tenantId, threshold, count)
       - Mapear results con metadata:
         - is_guest_unit (boolean)
         - is_public_info (source_table === 'accommodation_units_public')
         - is_private_info (source_table === 'accommodation_units_manual')
       - Log results breakdown: public_units count, manual_content count

     - Actualizar system prompt:
       - Sección 1: "INFORMACIÓN PÚBLICA (Todas las unidades)"
       - Explicar: Puede mencionar y comparar TODAS las unidades
       - Útil para: Re-booking, upgrade options
       - Sección 2: "INFORMACIÓN PRIVADA (Solo tu unidad: ${guest_unit_name})"
       - Explicar: Manual, WiFi password, instrucciones SOLO de su unidad
       - WARNING: NUNCA mencionar info privada de otras unidades
       - Ejemplos: Re-booking query vs WiFi query

2. TESTING (@testing):
   - Unit tests: src/lib/__tests__/conversational-chat-engine.test.ts
     - Test 1: searchAccommodationEnhanced() retorna public de TODAS las units
       - Verificar: uniqueUnits.size > 1 (múltiples unidades)
     - Test 2: searchAccommodationEnhanced() retorna manual SOLO de guest_unit
       - Verificar: ALL manual results have id === guestUnitId
     - Test 3: Re-booking query → menciona múltiples unidades (public)
       - Query: "¿Tienen apartamentos más grandes?"
       - Verificar: response menciona varias opciones
     - Test 4: Manual query → solo info de guest_unit
       - Query: "¿Cómo funciona el aire acondicionado?"
       - Verificar: manual content de SU unidad
     - Test 5: Cross-unit comparison → public info de ambas
       - Query: "Compara mi suite con Deluxe"
       - Verificar: public info de ambas unidades
     - Test 6: WiFi password leak prevention
       - Query: "¿Cuál es el WiFi del Apartamento Deluxe?" (NO es su unidad)
       - Verificar: response NO contiene password
       - Verificar: response contiene "solo puedo proporcionar info de tu unidad"

   - E2E tests: e2e/guest-chat-enhanced.spec.ts (5 scenarios)
     1. Guest asks "¿Tienen suites más grandes?" → lista public info de todas
     2. Guest asks "¿Cómo funciona el AC?" → manual de SU unidad solamente
     3. Guest asks "Compara mi suite con Deluxe" → public info de ambas
     4. Guest asks "¿WiFi password del Deluxe?" → permission denied
     5. Verify NO manual content leak de otras unidades (fuzzing test)

3. VALIDACIÓN:
   - Manual testing con reserva real:
     - Guest con Suite Ocean View asignada
     - Query: "¿Qué otros apartamentos tienen?" → debe listar TODOS
     - Query: "¿Cuál es el WiFi?" → debe dar password de Suite Ocean View SOLAMENTE
   - Performance check: Response time < 2s (p95)
   - Security audit: Verificar NO leak de manual content

4. ENTREGABLES:
   - src/lib/conversational-chat-engine.ts (actualizado)
   - 8 unit tests nuevos (+ actualizar existentes)
   - 5 E2E scenarios
   - Manual testing checklist completado
   - Performance report (antes vs después)

Ver plan.md líneas 1931-2124 para código completo y ejemplos de system prompt.

IMPORTANTE: Este cambio permite RE-BOOKING pero debe mantener SEGURIDAD de manual content. Testear exhaustivamente para prevenir leaks.
```

---

## ✅ Checklist de Validación Post-Implementación

### FASE A Validation
- [ ] Staff login funciona con credenciales válidas
- [ ] Staff login rechaza credenciales inválidas
- [ ] CEO puede acceder a admin content
- [ ] Housekeeper NO puede acceder a admin content
- [ ] SIRE queries retornan documentación correcta
- [ ] Operations queries retornan info específica del hotel
- [ ] Conversaciones se guardan en database
- [ ] JWT expira después de 24h
- [ ] RLS policies bloquean acceso cross-tenant
- [ ] Performance: Authentication < 500ms, Chat < 2s

### FASE B Validation
- [ ] Session creation funciona sin auth
- [ ] Cookie session persiste por 7 days
- [ ] Intent extraction captura fechas correctamente
- [ ] Intent extraction captura guests correctamente
- [ ] Availability URL se genera con intent completo
- [ ] Public search NO retorna manual content
- [ ] Public search retorna pricing + photos
- [ ] Conversation history se guarda (últimos 20)
- [ ] Follow-up suggestions son contextuales
- [ ] Mobile UI funciona (bubble expand/collapse)
- [ ] Rate limiting funciona (10 req/min por IP)
- [ ] Performance: Session creation < 200ms, Chat < 2s

### FASE C Validation
- [ ] Backup de accommodation_units completado
- [ ] accommodation_units_public count = original
- [ ] accommodation_units_manual count = original
- [ ] Guest ve public info de TODAS las unidades
- [ ] Guest ve manual SOLO de su unidad asignada
- [ ] Re-booking queries mencionan múltiples opciones
- [ ] WiFi password queries NO leak de otras unidades
- [ ] HNSW indexes funcionan (ambos)
- [ ] Performance: < 300ms vector search
- [ ] Rollback plan probado en staging
- [ ] E2E tests passing (5 scenarios)

---

## 📊 Métricas de Éxito

### Adoption Targets
- **Staff Chat**: >70% daily active staff by Week 8
- **Public Chat**: >15% visitor engagement by Week 12
- **Guest Chat**: >40% guest usage by Week 16

### Performance Targets
- **Authentication**: < 500ms (p95)
- **Chat Response**: < 2s (p95)
- **Vector Search**: < 300ms (p95)
- **Uptime**: > 99.5%

### Quality Targets
- **Response Accuracy**: > 90% (human evaluation)
- **Permission Violations**: 0 (critical)
- **Data Leakage**: 0 (critical)
- **User Bugs**: < 5/month

---

## 🚨 Troubleshooting

### Common Issues

**FASE A: JWT token inválido**
- Verificar JWT_SECRET_KEY en .env
- Verificar formato Bearer token en Authorization header
- Check expiration: JWT expira en 24h

**FASE A: Permission denied incorrectamente**
- Verificar staff_users.permissions JSONB tiene fields correctos
- Verificar role en JWT claim
- Check RLS policies: SELECT * FROM pg_policies WHERE tablename = 'hotel_operations'

**FASE B: Intent no se captura**
- Verificar Claude Haiku API key válida
- Check prompt format en extractTravelIntent()
- Validar JSON parsing no falla
- Logs: [intent-extraction] debe mostrar extracted values

**FASE B: Session no persiste**
- Verificar cookie se setea: Set-Cookie header en response
- Check expires_at en prospective_sessions
- Verificar cookie no se borra por CORS issues

**FASE C: Manual content leak**
- Verificar match_guest_accommodations() filtra por p_guest_unit_id
- Check RPC function UNION: segunda query MUST have WHERE unit_id = p_guest_unit_id
- Audit logs: Review all sources returned, verificar source_table

**FASE C: Performance degradation**
- Verificar HNSW indexes existen: SELECT * FROM pg_indexes WHERE indexname LIKE '%hnsw%'
- Run EXPLAIN ANALYZE en RPC function
- Check embedding dimensions: public usa 1024d, manual usa 1536d

---

**Documento creado**: Octubre 1, 2025
**Última actualización**: Octubre 1, 2025
**Versión**: 1.0
