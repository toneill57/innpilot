# PROMPTS_WORKFLOW - Guest Chat Test Data Alignment

**Proyecto:** Alineación de Datos de Prueba para Guest Chat
**Fecha:** Octubre 1, 2025

Este archivo contiene prompts listos para copy-paste en nuevas conversaciones con Claude Code. Cada prompt es autocontenido y especifica exactamente qué hacer.

---

## 🎯 Contexto General (Usar SIEMPRE al inicio)

```
Estoy trabajando en el proyecto "Guest Chat Test Data Alignment" para InnPilot.

CONTEXTO:
- Proyecto: Corregir datos de prueba en guest_reservations para poder probar el Guest Chat con diferentes alojamientos de Simmerdown
- Archivos clave:
  - /Users/oneill/Sites/apps/InnPilot/plan.md (plan completo)
  - /Users/oneill/Sites/apps/InnPilot/TODO.md (tareas detalladas)
  - /Users/oneill/Sites/apps/InnPilot/PROMPTS_WORKFLOW.md (este archivo)

PROBLEMA A RESOLVER:
- 8 de 10 reservas tienen tenant_id incorrecto ("ONEILL SAID SAS" string en vez de UUID)
- 9 de 10 reservas no tienen accommodation_unit_id asignado
- Necesito diversificar datos de prueba para probar diferentes tipos de alojamientos

HERRAMIENTAS:
- MCP Supabase tools (execute_sql, list_tables)
- Tablas principales: guest_reservations, accommodation_units, chat_conversations

Por favor, lee plan.md y TODO.md antes de empezar.
```

---

## FASE 1: Corrección de Tenant IDs

### Prompt 1.1: Ejecutar Corrección Completa de FASE 1

```
He leído el plan.md y TODO.md del proyecto "Guest Chat Test Data Alignment".

TAREA: Ejecutar FASE 1 completa - Corrección de Tenant IDs

SUBTAREAS:
1. Ejecutar UPDATE para corregir tenant_id en guest_reservations:
   - Query: UPDATE guest_reservations SET tenant_id = 'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf' WHERE tenant_id = 'ONEILL SAID SAS';

2. Validar que no quedan tenant_id tipo string:
   - Query en TODO.md FASE 1.2

3. Validar integridad de FK con chat_conversations:
   - Query en TODO.md FASE 1.3

4. Marcar las tareas FASE 1.1, 1.2, 1.3 como [x] en TODO.md SOLO si todos los tests pasan

CRITERIOS DE ÉXITO:
- ✅ 9 reservas con tenant_id = 'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf'
- ✅ 0 reservas con tenant_id tipo string
- ✅ No foreign key violations
- ✅ Conversaciones siguen accesibles

ARCHIVOS A MODIFICAR:
- TODO.md (marcar tareas completadas)

AGENTE: database-agent
USO: MCP Supabase tools para ejecutar queries

Por favor, procede paso por paso y muéstrame los resultados de cada query.
```

### Prompt 1.2: Documentar FASE 1

```
Acabo de completar FASE 1 del proyecto "Guest Chat Test Data Alignment".

TAREA: Crear documentación de FASE 1

ARCHIVOS A CREAR:
1. docs/guest-chat-test-data-setup/fase-1/IMPLEMENTATION.md
   - Resumen de lo implementado
   - Queries ejecutadas
   - Resultados obtenidos

2. docs/guest-chat-test-data-setup/fase-1/CHANGES.md
   - Lista de reservas modificadas
   - Cambios realizados (tenant_id antes → después)

3. docs/guest-chat-test-data-setup/fase-1/TESTS.md
   - Tests ejecutados
   - Resultados de validaciones
   - Criterios de éxito verificados

CONTEXTO:
- Se actualizaron 8 reservas en guest_reservations
- Cambio: tenant_id de "ONEILL SAID SAS" → 'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf'
- Todas las validaciones pasaron exitosamente

TEMPLATE: Usa los templates de documentation de plan.md

Una vez creados los archivos, marca FASE 1.4 como [x] en TODO.md.
```

---

## FASE 2: Asignación de Accommodation Units

### Prompt 2.1: Ejecutar Pre-validación y Corrección de hotel_id

```
He leído el plan.md y TODO.md del proyecto "Guest Chat Test Data Alignment".

TAREA: Ejecutar FASE 2.1 y 2.2 - Pre-validación de hotel_id

SUBTAREAS:
1. Ejecutar audit de hotel_id en accommodation_units:
   - Query en TODO.md FASE 2.1

2. Si hay unidades con hotel_id NULL, ejecutar UPDATE:
   - Query en TODO.md FASE 2.2

3. Validar que no quedan unidades sin hotel_id:
   - Query de validación en TODO.md FASE 2.2

4. Marcar FASE 2.1 y 2.2 como [x] en TODO.md si todos los tests pasan

CRITERIOS DE ÉXITO:
- ✅ 0 unidades de Simmerdown con hotel_id NULL
- ✅ Todas las unidades tienen hotel_id = '238845ed-8c5b-4d33-9866-bb4e706b90b2'

ARCHIVOS A MODIFICAR:
- Database: accommodation_units (posiblemente hasta 8 UPDATEs)
- TODO.md (marcar tareas completadas)

AGENTE: database-agent
USO: MCP Supabase tools

Por favor, muéstrame los resultados del audit antes de ejecutar UPDATEs.
```

### Prompt 2.2: Asignar Accommodation Units a Reservas

```
He leído el plan.md y TODO.md del proyecto "Guest Chat Test Data Alignment".

TAREA: Ejecutar FASE 2.3 a 2.11 - Asignación de accommodation_unit_id

SUBTAREAS:
Ejecutar los 9 UPDATEs especificados en TODO.md FASE 2.3 a 2.11:
- RSV001 → Suite Ocean View (id: 43ff96da-dbef-4757-88e5-31f7618edd33)
- RSV002 → Sunshine (id: ed0c8645-ba0a-4004-8a12-3f6fadcf7f26)
- RSV003 → Simmer Highs (id: dbaf779f-ac2f-41e0-9056-3fb4bdbdfbe9)
- RSV004 → One Love (id: 6aadbad2-df24-4dbe-a1f8-c4c55defe5c8)
- RSV005 → Misty Morning (id: d6d8534d-632e-4baf-ae18-a5ef60d9be6d)
- RSV006 → Natural Mystic (id: da357e13-a06e-4ef0-b0a1-3e9b453ba1ef)
- RSV007 → Dreamland (id: e0e8e004-74a4-416e-999f-b746265c7fd9)
- RSV008 → Kaya (id: 6c341cf7-cb12-46cb-a5c7-b67169293059)
- TEST001 → Summertime (id: adb97f6f-4791-49d1-90d5-8275c8c08aad)

VALIDACIONES:
1. Después de los UPDATEs, ejecutar query de FASE 2.12 (verificar no hay NULL)
2. Ejecutar query de FASE 2.13 (verificar unicidad, no duplicados)

CRITERIOS DE ÉXITO:
- ✅ 9 reservas con accommodation_unit_id asignado
- ✅ 0 reservas de Simmerdown con accommodation_unit_id NULL
- ✅ No duplicados (cada unidad asignada a máximo 1 reserva)

ARCHIVOS A MODIFICAR:
- Database: guest_reservations (9 UPDATEs)
- TODO.md (marcar FASE 2.3 a 2.13 como [x])

AGENTE: database-agent

Por favor, ejecuta los UPDATEs uno por uno y muéstrame los resultados de las validaciones.
```

### Prompt 2.3: Documentar FASE 2

```
He completado FASE 2 del proyecto "Guest Chat Test Data Alignment".

TAREA: Crear documentación de FASE 2

ARCHIVOS A CREAR:
1. docs/guest-chat-test-data-setup/fase-2/IMPLEMENTATION.md
   - Resumen de asignaciones realizadas
   - Tabla de mapeo: Reserva → Accommodation Unit
   - hotel_id updates (si hubo)

2. docs/guest-chat-test-data-setup/fase-2/CHANGES.md
   - Lista de 9 reservas modificadas
   - accommodation_unit_id asignado a cada una
   - accommodation_units modificadas (hotel_id)

3. docs/guest-chat-test-data-setup/fase-2/TESTS.md
   - Validaciones ejecutadas (FASE 2.12, 2.13)
   - Resultados (0 NULL, 0 duplicados)
   - FK integrity checks

CONTEXTO:
- Se asignaron 9 accommodation_unit_id a reservas
- Distribución equitativa entre las unidades de Simmerdown
- Todas las validaciones pasaron

Marca FASE 2.14 como [x] en TODO.md después de crear los archivos.
```

---

## FASE 3: Validación de Datos de Unidades

### Prompt 3.1: Ejecutar Audit de Datos de Accommodation Units

```
He leído el plan.md y TODO.md del proyecto "Guest Chat Test Data Alignment".

TAREA: Ejecutar FASE 3.1 y 3.2 - Audit de Datos de Unidades

SUBTAREAS:
1. Ejecutar query de audit completo:
   - Query en TODO.md FASE 3.1
   - Verificar: description, embeddings (fast/balanced), short_description, tourism_features

2. Analizar resultados (FASE 3.2):
   - Identificar unidades con datos faltantes
   - Decidir si es crítico generar embeddings ahora o documentar como Next Steps

3. Mostrarme un resumen con:
   - Cuántas unidades tienen description ✅
   - Cuántas tienen embeddings ✅
   - Cuáles tienen datos incompletos ❌

CRITERIOS PARA DECISIÓN:
- Si ≥ 5 unidades NO tienen embeddings → Ejecutar FASE 3.3 (generar embeddings)
- Si < 5 unidades → Documentar en ISSUES.md como "non-blocker"

ARCHIVOS A MODIFICAR:
- TODO.md (marcar FASE 3.1 y 3.2)

AGENTE: database-agent

Por favor, ejecuta el audit y dame un resumen visual de los resultados.
```

### Prompt 3.2: Generar Embeddings Faltantes (SI ES NECESARIO)

```
Según el audit de FASE 3.1, necesitamos generar embeddings para accommodation_units.

TAREA: FASE 3.3 - Generar embeddings faltantes

OPCIONES:
1. Si existe script adaptable:
   - Revisar scripts/populate-embeddings.js
   - Adaptarlo para accommodation_units si es necesario

2. Si no existe script:
   - Crear script nuevo: scripts/generate-accommodation-embeddings.js
   - Usar OpenAI API para generar embeddings
   - UPDATE accommodation_units con embeddings generados

3. Si no es crítico:
   - Documentar en ISSUES.md
   - Marcar como "Next Steps" en plan.md

CONTEXTO:
- Unidades sin embeddings no podrán ser encontradas en vector search
- Esto bloquearía el context retrieval en el chat

DECISIÓN REQUERIDA:
¿Hay script reutilizable o necesito crear uno nuevo?
¿Los embeddings son críticos para el testing de FASE 4?

AGENTE: backend-developer (si se requiere script nuevo)

Por favor, analiza las opciones y recomienda el mejor approach.
```

### Prompt 3.3: Documentar FASE 3

```
He completado FASE 3 del proyecto "Guest Chat Test Data Alignment".

TAREA: Crear documentación de FASE 3

ARCHIVOS A CREAR:
1. docs/guest-chat-test-data-setup/fase-3/IMPLEMENTATION.md
   - Resultados del audit
   - Tabla resumen: Unit → has_description, has_embeddings, etc.
   - Acciones tomadas (embeddings generados o no)

2. docs/guest-chat-test-data-setup/fase-3/CHANGES.md
   - Unidades modificadas (si se generaron embeddings)
   - Scripts creados (si aplica)

3. docs/guest-chat-test-data-setup/fase-3/TESTS.md
   - Query de audit ejecutada
   - Resultados finales después de cambios

4. docs/guest-chat-test-data-setup/fase-3/ISSUES.md
   - Datos faltantes no críticos
   - Recomendaciones para población de datos futura

CONTEXTO:
- Se ejecutó audit completo de accommodation_units
- [Describir si se generaron embeddings o se documentó como Next Steps]

Marca FASE 3.4 como [x] en TODO.md después de crear los archivos.
```

---

## FASE 4: Testing del Flujo Completo

### Prompt 4.1: Preparación para Testing Manual

```
He completado FASE 1, 2 y 3 del proyecto "Guest Chat Test Data Alignment".

TAREA: Preparar entorno para FASE 4 - Testing Manual

SUBTAREAS:
1. Crear estructura de carpetas para documentación:
   mkdir -p docs/guest-chat-test-data-setup/fase-4/screenshots

2. Iniciar development server:
   ./scripts/dev-with-keys.sh

3. Verificar que el servidor está running:
   open http://localhost:3000/guest-chat/simmerdown

4. Crear checklist para testing:
   - [ ] Login con María González (4567)
   - [ ] Login con Luis Martínez (3344)
   - [ ] Login con Carmen Silva (7788)
   - [ ] Context retrieval test para cada sesión
   - [ ] Memory persistence test

ARCHIVOS A CREAR:
- docs/guest-chat-test-data-setup/fase-4/screenshots/ (carpeta)

PRÓXIMOS PASOS:
Una vez el servidor esté running, proceder con testing manual según TODO.md FASE 4.3 a 4.9.

NOTA: Este testing es MANUAL - requiere interacción con el navegador.

Marca FASE 4.1 y 4.2 como [x] en TODO.md cuando el servidor esté listo.
```

### Prompt 4.2: Documentar Resultados de Testing

```
He completado el testing manual de FASE 4 (FASE 4.3 a 4.9).

TAREA: Documentar resultados completos de FASE 4

ARCHIVOS A CREAR:
1. docs/guest-chat-test-data-setup/fase-4/TESTING_RESULTS.md
   - Resumen ejecutivo de todos los tests
   - Tabla de resultados por cada reserva probada
   - Referencias a screenshots
   - Issues encontrados (si los hay)

2. docs/guest-chat-test-data-setup/fase-4/ISSUES.md
   - Problemas encontrados durante testing
   - Bugs identificados
   - Comportamientos inesperados

3. docs/guest-chat-test-data-setup/fase-4/RECOMMENDATIONS.md
   - Mejoras sugeridas para el Guest Chat
   - Optimizaciones de UX
   - Próximos pasos para productionización

TEMPLATE para TESTING_RESULTS.md:
# FASE 4: Testing Results

## Resumen Ejecutivo
- Tests ejecutados: X/11
- Tests exitosos: X
- Tests fallidos: X
- Tiempo total: X minutos

## Resultados por Reserva

### Test 1: María González (Suite Ocean View)
- Login: ✅/❌
- Context Retrieval: ✅/❌
- Screenshot: [login-maria.png](./screenshots/login-maria.png)
- Notas: ...

[Repetir para cada reserva]

## Context Retrieval Analysis
[Análisis de qué tan preciso fue el context retrieval]

## Memory Persistence
[Análisis de la memoria conversacional]

## Issues Encontrados
[Lista de problemas, ver ISSUES.md para detalles]

CONTEXTO:
- Proveeré screenshots y notas de testing
- Usa esa información para crear la documentación

Marca FASE 4.10 y 4.11 como [x] en TODO.md después de crear los archivos.
```

---

## 🚀 Quick Start Guide

### Orden Recomendado de Ejecución

**Sesión 1: FASE 1** (15 min)
```
1. Copy-paste "Contexto General"
2. Copy-paste "Prompt 1.1: Ejecutar Corrección Completa de FASE 1"
3. Verificar resultados
4. Copy-paste "Prompt 1.2: Documentar FASE 1" (en nueva conversación si quieres)
```

**Sesión 2: FASE 2** (20 min)
```
1. Copy-paste "Contexto General"
2. Copy-paste "Prompt 2.1: Pre-validación hotel_id"
3. Copy-paste "Prompt 2.2: Asignar Accommodation Units"
4. Copy-paste "Prompt 2.3: Documentar FASE 2"
```

**Sesión 3: FASE 3** (15 min)
```
1. Copy-paste "Contexto General"
2. Copy-paste "Prompt 3.1: Audit de Datos"
3. SI ES NECESARIO: Copy-paste "Prompt 3.2: Generar Embeddings"
4. Copy-paste "Prompt 3.3: Documentar FASE 3"
```

**Sesión 4: FASE 4** (20 min - MANUAL)
```
1. Copy-paste "Contexto General"
2. Copy-paste "Prompt 4.1: Preparación para Testing"
3. MANUAL: Ejecutar tests en navegador (seguir TODO.md FASE 4.3-4.9)
4. Copy-paste "Prompt 4.2: Documentar Resultados"
```

---

## 📝 Tips para Uso

**✅ DO:**
- Siempre empezar con "Contexto General"
- Leer plan.md y TODO.md antes de ejecutar prompts
- Verificar que cada fase se completó antes de pasar a la siguiente
- Marcar tareas en TODO.md solo cuando tests pasen
- Tomar screenshots durante testing manual

**❌ DON'T:**
- No saltarte validaciones
- No marcar tareas como [x] sin ejecutar tests
- No mezclar fases (terminar FASE 1 antes de empezar FASE 2)
- No olvidar documentar cada fase

**🔧 Troubleshooting:**
- Si un test falla, documéntalo en ISSUES.md
- Si necesitas rollback, todas las queries están en TODO.md
- Si encuentras bugs, documenta antes de continuar

---

**Última actualización:** Octubre 1, 2025
**Autor:** Claude Code
