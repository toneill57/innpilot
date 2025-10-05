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

### 2.1 Database Migrations
- [ ] Crear `supabase/migrations/20251005010000_add_guest_conversations.sql` (30min)
  - Agent: **@agent-database-agent**
  - Prompt: Workflow 2.1

### 2.2 Backend API - Conversations CRUD
- [ ] POST/GET `/api/guest/conversations` (45min)
- [ ] PUT/DELETE `/api/guest/conversations/[id]` (1h)
  - Agent: **@agent-backend-developer**
  - Prompt: Workflow 2.2

### 2.3 UI Components
- [ ] `ConversationList.tsx` (2h)
- [ ] Refactor `GuestChatInterface.tsx` con sidebar (3h)
  - Agent: **@agent-ux-interface**
  - Prompt: Workflow 2.3

### 2.5 Multi-Modal File Upload (4-5h)
- [ ] Supabase Storage + migrations (1h)
- [ ] Claude Vision API (1h)
- [ ] Backend API attachments (1h)
- [ ] UI upload button (1h)
- [ ] Testing (1h)
  - Agent: **@agent-backend-developer** + **@agent-ux-interface**
  - Prompt: Workflow 2.5

### 2.6 Conversation Intelligence (3-4h)
- [ ] Schema updates (30min)
- [ ] `guest-conversation-memory.ts` (2h)
- [ ] Auto-trigger compactación (30min)
- [ ] UI suggestions (1h)
- [ ] Cron jobs (1h)
  - Agent: **@agent-backend-developer** + **@agent-ux-interface**
  - Prompt: Workflow 2.6

---

## 🔒 FASE 3: Compliance Module (10-12h)

### 3.1 Compliance Chat Engine
- [ ] `compliance-chat-engine.ts` (3h)
- [ ] Intent detection (1h)
- [ ] Backend integration (1h)
  - Agent: **@agent-backend-developer**
  - Prompt: Workflow 3.1 (CORREGIDO con campos SIRE reales)

### 3.2 SIRE + TRA Integration
- [ ] `scripts/sire-push.ts` Puppeteer (3h)
- [ ] Credentials management (1h)
- [ ] TRA API investigation (2h)
- [ ] `lib/integrations/tra/client.ts` (2h)
  - Agent: **@agent-backend-developer** + **@agent-api-endpoints-mapper**
  - Prompt: Workflow 3.2, 3.3

### 3.3 Compliance UI
- [ ] `ComplianceReminder.tsx` (1h)
- [ ] `ComplianceConfirmation.tsx` (1.5h)
- [ ] `ComplianceSuccess.tsx` (1h)
- [ ] Integration end-to-end (1h)
  - Agent: **@agent-ux-interface** + **@agent-backend-developer**
  - Prompt: Workflow 3.4 (CORREGIDO con dos capas)

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

**Total Tareas:** 80
**Completadas:** 6 (FASE 1) + 8 (FASE 0.5) = 14/80 (18%)

**Timeline Estimado Restante:** 32-38 horas

**Próximo:** FASE 2.1 (Database Migrations)

---

**Última actualización:** 5 de Octubre 2025 23:30
