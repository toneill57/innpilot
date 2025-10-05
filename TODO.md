# TODO - Guest Portal Multi-Conversation + Compliance Module

**Proyecto:** Guest Portal Multi-Conversation Architecture with Integrated Compliance
**Fecha:** 5 de Octubre 2025
**Plan:** Ver `plan.md` para contexto completo (1720 líneas)

---

## ✅ FASES COMPLETADAS

- **FASE 0**: Planning & Setup ✅ (2h)
- **FASE 1**: Subdomain Infrastructure ✅ (3-4h)
  - DNS Wildcard, SSL, Nginx routing, Middleware, Tenant resolver

---

## ✅ FASE 0.5: Corrección Campos SIRE (COMPLETADA)

**Contexto:** Se descubrió que los campos compliance definidos en plan original eran campos dummy que NO correspondían con los 13 campos obligatorios SIRE oficiales.

**Solución:** Arquitectura de DOS CAPAS (conversational_data + sire_data)

### 0.5.1 Auditoría FASE 1+2 ✅
- [x] Auditar archivos FASE 1 (30min)
  - Revisado: `docs/deployment/nginx-subdomain.conf` ✅
  - Revisado: `docs/deployment/SUBDOMAIN_SETUP_GUIDE.md` ✅
  - Revisado: `src/middleware.ts` (líneas 68-136) ✅
  - Revisado: `src/lib/tenant-resolver.ts` (líneas 39-92) ✅
  - Verificado: NO hay referencias a campos compliance dummy ✅
  - Deliverable: `AUDITORIA_FASES_1_2.md` (354 líneas) ✅

- [x] Auditar archivos FASE 2.2 (30min)
  - Revisado: `src/app/api/guest/conversations/route.ts` ✅
  - Revisado: `src/app/api/guest/conversations/[id]/route.ts` ✅
  - Revisado: `src/app/api/guest/chat/history/route.ts` ✅
  - Resultado: 100% limpios, 0 referencias dummy ✅

### 0.5.2 Crear catálogo SIRE oficial ✅
- [x] Crear `docs/sire/CODIGOS_OFICIALES.md` (30min)
  - 4 tipos de documento válidos (3, 5, 46, 10) ✅
  - Placeholder códigos nacionalidad (PROVISIONAL ISO 3166-1) ✅
  - Formatos y validaciones 13 campos ✅
  - Deliverable: 657 líneas ✅

### 0.5.3 Actualizar plan.md FASE 3 ✅
- [x] Corregir `plan.md` FASE 3.1 (1h)
  - Interface ComplianceContext (dos capas) ✅
  - Entity extraction actualizado ✅
  - Validaciones SIRE oficiales ✅

### 0.5.4 Actualizar workflow Prompt 3.1 ✅
- [x] Corregir `guest-portal-compliance-workflow.md` Prompt 3.1 (1.5h)
  - Reescribir ComplianceContext ✅
  - Reescribir extractComplianceEntities() ✅
  - Reescribir generateConfirmationMessage() ✅
  - Reescribir validateComplianceData() ✅

### 0.5.5 Actualizar workflow Prompt 3.4 ✅
- [x] Corregir `guest-portal-compliance-workflow.md` Prompt 3.4 (1h)
  - Specs ComplianceConfirmation.tsx con dos capas ✅
  - Layout editable + read-only colapsable ✅
  - Deliverable: `UI_COMPLIANCE_REDESIGN_SPEC.md` (752 líneas) ✅

### 0.5.6 Crear utilidades mapping SIRE ✅
- [x] Crear `src/lib/sire/field-mappers.ts` (1h)
  - splitFullName() ✅
  - mapCountryToCode() ✅
  - formatDateForSIRE() ✅
  - Validaciones (7 funciones) ✅
  - Deliverable: 551 líneas, 9 funciones ✅

### 0.5.7 Corregir migration SQL ✅
- [x] Actualizar `supabase/migrations/20251005010100_add_compliance_submissions.sql` (15min)
  - Línea 91: Comentario JSONB con estructura DOS CAPAS ✅

### 0.5.8 Generar reporte ✅
- [x] Crear `CORRECCION_CAMPOS_SIRE_REPORT.md` (30min)
  - Resumen problema, hallazgos, correcciones ✅
  - Deliverable: 738 líneas, 11 secciones ✅

**FASE 0.5 Completada:** 5 documentos creados (2,314 líneas), 4 archivos modificados, 0 errores encontrados

---

## 📋 FASE 2: Multi-Conversation Foundation (6-8h)

### 2.1 Database Migrations ✅
- [x] Crear `supabase/migrations/20251005010000_add_guest_conversations.sql` (30min)
  - Schema: guest_conversations table ✅
  - RLS policies: Guests own conversations ✅
  - Indexes: guest_id, tenant_id, updated_at ✅
  - Agent: **@agent-database-agent**
  - Deliverable: 99 líneas ✅

- [x] Verificar migrations existentes (30min)
  - compliance_submissions (95 líneas) - Comentario DOS CAPAS ✅
  - tenant_compliance_credentials (88 líneas) ✅
  - conversation_attachments (145 líneas) - FASE 2.5 ✅
  - conversation_intelligence (36 líneas) - FASE 2.6 ✅
  - Deliverable: 6 migrations totales ✅

### 2.2 Backend API - Conversations CRUD ✅
- [x] POST/GET `/api/guest/conversations` (45min)
  - POST: Crear nueva conversación ✅
  - GET: Listar conversaciones del guest ✅
  - JWT authentication + RLS ✅
  - Deliverable: route.ts (145 líneas) ✅

- [x] PUT/DELETE `/api/guest/conversations/[id]` (1h)
  - PUT: Actualizar título ✅
  - DELETE: Eliminar conversación (CASCADE) ✅
  - Next.js 15 async params ✅
  - Deliverable: [id]/route.ts (167 líneas) ✅

- [x] Modificar `/api/guest/chat/history/route.ts` (15min)
  - Query param conversation_id OPCIONAL ✅
  - Backward compatibility ✅
  - Deliverable: 10 líneas modificadas ✅

- [x] Testing completo (30min)
  - 7 CRUD tests PASSED ✅
  - 3 RLS tests PASSED ✅
  - Response times: 500-1150ms ✅
  - Deliverable: FASE_2.2_TESTING_REPORT.md (287 líneas) ✅

  Agent: **@agent-backend-developer**
  Prompt: Workflow 2.2

### 2.3 UI Components ✅ COMPLETADO (Oct 5, 2025)
- [x] `ConversationList.tsx` (2h) ✅
- [x] Refactor `GuestChatInterface.tsx` con sidebar (3h) ✅
- [x] date-fns instalado y funcionando ✅
- [x] Delete conversation implementado ✅
- [x] Entity tracking preservado ✅
- [x] Follow-up suggestions preservados ✅
- [x] Testing manual 46/46 PASS ✅
  - Agent: **@ux-interface**
  - Prompt: Workflow 2.3
  - Docs: `/docs/guest-portal-multi-conversation/fase-2.3/`

### 2.5 Multi-Modal File Upload ✅ COMPLETADO (Oct 5, 2025)
- [x] Supabase Storage bucket verificado (30min) ✅
- [x] Claude Vision API `src/lib/claude-vision.ts` (1h) ✅
- [x] Backend API `/api/guest/conversations/[id]/attachments` (1h) ✅
- [x] UI upload button + modal (1.5h) ✅
- [x] Test script `scripts/test-file-upload.ts` (30min) ✅
  - Agent: **@agent-backend-developer** + **@agent-ux-interface**
  - Prompt: Workflow 2.5
  - Docs: `FASE_2.5_MULTI_MODAL_REPORT.md`
  - Performance: 2-3.5s upload + analysis (target: <5s) ✅

### 2.6 Conversation Intelligence ✅ COMPLETADO (Oct 5, 2025)
- [x] Schema updates (30min) ✅
- [x] `guest-conversation-memory.ts` (2h) ✅ (ya existía completo)
- [x] Auto-trigger compactación (30min) ✅ (ya integrado en chat API)
- [x] Cron jobs (1h) ✅ (archive-conversations.ts + delete-archived.ts + API endpoint)
- [x] Test script (30min) ✅ (scripts/test-conversation-memory.ts ya completo)
- [x] UI suggestions (1h) ✅ Topic suggestion banner implementado
  - Agent: **@agent-backend-developer** ✅ + **@agent-ux-interface** ✅
  - Prompt: Workflow 2.6
  - Docs: `FASE_2.6_CONVERSATION_INTELLIGENCE_REPORT.md` + `FASE_2.6_UI_REPORT.md`

---

## 🔒 FASE 3: Compliance Module (10-12h)

### 3.1 Compliance Chat Engine ✅ COMPLETADO (Oct 5, 2025)
- [x] `compliance-chat-engine.ts` (3h) ✅
  - ComplianceChatEngine class ✅
  - extractEntities() con Claude ✅
  - validateConversationalData() ✅
  - calculateCompleteness() ✅
  - mapToSIRE() (conversational → 13 campos) ✅
  - validateSIREData() ✅
  - generateSIRETXT() ✅
  - Deliverable: 685 líneas ✅
- [x] `sire-country-mapping.ts` (1h) ✅
  - SIRE_COUNTRY_CODES (100+ países) ✅
  - getCountryCode(), getCountryName() ✅
  - searchCountries(), normalizeCountryName() ✅
  - COUNTRY_ALIASES (English/Spanish) ✅
  - Deliverable: 279 líneas ✅
- [x] `sire-automation.ts` (2h) ✅
  - SIREAutomation class (Puppeteer) ✅
  - submitToSIRE() ✅
  - login(), navigateToRegistrationForm() ✅
  - fillSIREForm() (13 campos) ✅
  - submitForm() + capture reference ✅
  - Error handling + screenshots ✅
  - testSIREConnection() ✅
  - Deliverable: 489 líneas ✅
- [x] API routes (1.5h) ✅
  - POST /api/compliance/submit ✅
  - GET /api/compliance/status/:id ✅
  - PATCH /api/compliance/status/:id ✅
  - Deliverable: submit/route.ts (270 líneas), status/[submissionId]/route.ts (225 líneas) ✅
  - Agent: **@agent-backend-developer** ✅
  - Prompt: Workflow 3.1 (CORREGIDO con campos SIRE reales) ✅

### 3.2 SIRE + TRA Integration
- [ ] `scripts/sire-push.ts` Puppeteer (3h)
- [ ] Credentials management (1h)
- [ ] TRA API investigation (2h)
- [ ] `lib/integrations/tra/client.ts` (2h)
  - Agent: **@agent-backend-developer** + **@agent-api-endpoints-mapper**
  - Prompt: Workflow 3.2, 3.3

### 3.4 Compliance UI ✅ COMPLETADO (Oct 5, 2025)
- [x] `ComplianceReminder.tsx` (1h) ✅
- [x] `ComplianceConfirmation.tsx` (1.5h) ✅
- [x] `ComplianceSuccess.tsx` (1h) ✅
- [x] `EditableField.tsx` (componente reutilizable) ✅
- [x] `SireDataCollapse.tsx` (componente colapsable) ✅
- [x] Arquitectura DOS CAPAS implementada ✅
- [x] Validaciones cliente (regex) ✅
- [x] Hover mapping visual ✅
- [x] Mobile responsive (320px-430px) ✅
- [x] Accessibility (ARIA, keyboard nav) ✅
- [ ] Integration end-to-end (requiere backend API 3.1-3.3)
  - Agent: **@agent-ux-interface** ✅ + **@agent-backend-developer** (pendiente)
  - Prompt: Workflow 3.4 (CORREGIDO con dos capas)
  - Docs: `FASE_3.4_COMPLIANCE_UI_REPORT.md` (1,070 líneas, 5 componentes)

---

## 📢 FASE 4: Staff Notifications (3-4h)

- [ ] Email notifications (1.5h)
- [ ] Backend API submissions (2h)
- [ ] Dashboard tab (2h)
  - Agent: **@agent-backend-developer** + **@agent-ux-interface**
  - Prompt: Workflow 4.1, 4.2

---

## ✅ FASE 5: Testing (4-5h)

- [ ] E2E tests (3h)
- [ ] Manual testing (2h)
- [ ] Performance validation (1h)
  - Agent: **@agent-backend-developer** + **@agent-ux-interface**
  - Prompt: Workflow 5.1

---

## 📊 FASE 6: SEO + Analytics (2-3h)

- [ ] Meta tags dinámicos (1h)
- [ ] Plausible Analytics (1h)
- [ ] Sitemap + robots.txt (1h)
  - Agent: **@agent-ux-interface**
  - Prompt: Workflow 6.1

---

## 📚 FASE 7: Documentation (2-3h)

- [ ] ARCHITECTURE.md (1h)
- [ ] API_REFERENCE.md (1h)
- [ ] User guides (1h)
- [ ] Deployment (1h)
  - Agent: **@agent-backend-developer** + **@agent-api-endpoints-mapper**
  - Prompt: Workflow 7.1

---

## 📈 PROGRESO

**Total Tareas:** 89
**Completadas:** 6 (FASE 1) + 8 (FASE 0.5) + 6 (FASE 2.1+2.2) + 2 (FASE 2.3) + 5 (FASE 2.5) + 6 (FASE 2.6) + 5 (FASE 3.4) + 4 (FASE 3.1) = 42/89 (47.2%)

**Archivos Creados (FASE 3.1 Backend):**
- `src/lib/compliance-chat-engine.ts` (685 líneas)
- `src/lib/sire/sire-country-mapping.ts` (279 líneas)
- `src/lib/sire/sire-automation.ts` (489 líneas)
- `src/app/api/compliance/submit/route.ts` (270 líneas)
- `src/app/api/compliance/status/[submissionId]/route.ts` (225 líneas)

**Total FASE 3.1:** 5 archivos, 1,948 líneas de código

**Archivos Creados (FASE 3.4 UI):**
- `src/components/Compliance/EditableField.tsx` (145 líneas)
- `src/components/Compliance/SireDataCollapse.tsx` (295 líneas)
- `src/components/Compliance/ComplianceConfirmation.tsx` (285 líneas)
- `src/components/Compliance/ComplianceSuccess.tsx` (200 líneas)
- `src/components/Compliance/ComplianceReminder.tsx` (145 líneas)
- `FASE_3.4_COMPLIANCE_UI_REPORT.md` (reporte ejecutivo, 415 líneas)

**Total FASE 3.4:** 5 componentes, 1,070 líneas de código

**Archivos Creados (FASE 2.6 Backend):**
- `src/lib/cron/delete-archived.ts` (79 líneas)
- `FASE_2.6_CONVERSATION_INTELLIGENCE_REPORT.md` (documentación backend)

**Archivos Creados (FASE 2.6 UI):**
- `scripts/test-topic-suggestion.ts` (100 líneas)
- `docs/guest-portal-multi-conversation/fase-2.6/UI_IMPLEMENTATION.md` (~500 líneas)
- `docs/guest-portal-multi-conversation/fase-2.6/CHANGES.md` (~300 líneas)
- `FASE_2.6_UI_REPORT.md` (reporte ejecutivo)

**Archivos Modificados (FASE 2.6 UI):**
- `src/components/Chat/GuestChatInterface.tsx` (+135 líneas - Topic suggestion banner)

**Archivos Ya Existentes (FASE 2.6 Backend):**
- `src/lib/guest-conversation-memory.ts` (487 líneas) ✅
- `src/lib/cron/archive-conversations.ts` (78 líneas) ✅
- `src/app/api/cron/archive-conversations/route.ts` (85 líneas) ✅
- `scripts/test-conversation-memory.ts` (310 líneas) ✅
- `src/app/api/guest/chat/route.ts` (auto-compactación integrada) ✅

**Timeline Estimado Restante:** 6-12 horas

**Próximo:** FASE 3.2 (TRA API Integration) o FASE 3 Integration End-to-End (conectar UI 3.4 con Backend 3.1)

---

**Última actualización:** 5 de Octubre 2025 16:30
