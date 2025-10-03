# Workflow de Prompts: Implementación UUIDs Determinísticos con Agentes Especializados

**Propósito:** Prompts optimizados para delegar a agentes especializados cada fase del plan de UUIDs determinísticos.

**🤖 Agentes Disponibles:**
- 🟣 `@database-agent` - Database operations, migrations, validación
- 🟠 `@backend-developer` - TypeScript/Node.js, business logic
- 🔴 `@infrastructure-monitor` - Performance, health checks, monitoring
- 🟣 `@deploy-agent` - Deploy automation, functional verification

**Instrucciones de Uso:**
1. Copiar el prompt completo de la fase correspondiente
2. Pegar en Claude Code (el sistema invocará automáticamente al agente especializado)
3. El agente ejecutará las tareas con contexto completo
4. Marcar fase completada en `TODO.md` antes de continuar con siguiente prompt

---

## ⏸️ FASE 1: Preparación y Análisis
**🟣 Responsable:** `@database-agent`

### Prompt 1.1: Backup y Documentación

```
🟣 Invocando @database-agent para FASE 1: Preparación y Análisis

**Contexto:** Implementación de UUIDs determinísticos para hotels.accommodation_units según plan.md (líneas 1-338).

**Tu responsabilidad:** Ejecutar FASE 1 completa del TODO.md usando tus herramientas MCP de Supabase.

**Referencias:**
- plan.md (líneas 162-178) - FASE 1 detallada
- TODO.md (líneas 11-81) - Checklist de tareas

**Acciones requeridas:**

1. **Crear backup de base de datos usando MCP tools:**
   ```sql
   SELECT id, tenant_id, motopress_unit_id, name, created_at
   FROM hotels.accommodation_units
   ORDER BY name;
   ```
   - Guardar resultados completos en nuevo archivo: `docs/uuid-snapshot-$(date +%Y%m%d).md`
   - Formato markdown con tabla de 5 columnas
   - Incluir timestamp y count total

2. **Verificar extensión uuid-ossp:**
   ```sql
   -- Verificar disponibilidad
   SELECT * FROM pg_available_extensions WHERE name = 'uuid-ossp';

   -- Verificar si está habilitada
   SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';
   ```
   - Reportar estado exacto

3. **Análisis de dependencias (usar MCP execute_sql):**
   ```sql
   -- Contar accommodations actuales
   SELECT COUNT(*) as total_accommodations FROM hotels.accommodation_units;

   -- Verificar FKs de tablas dependientes
   SELECT
     (SELECT COUNT(*) FROM guest_reservations WHERE accommodation_unit_id IS NOT NULL) as guest_reservations_count,
     (SELECT COUNT(*) FROM accommodation_units_manual WHERE unit_id IS NOT NULL) as manuals_count,
     (SELECT COUNT(*) FROM accommodation_units_manual_chunks WHERE accommodation_unit_id IS NOT NULL) as chunks_count;
   ```

4. **Documentación y reporte:**
   - Crear archivo `docs/uuid-snapshot-$(date +%Y%m%d).md` con todos los datos
   - Reportar en formato:
     ```
     ✅ Backup completo: X accommodations documentados
     ✅ uuid-ossp: [ESTADO]
     ✅ Dependencias verificadas: X reservas, Y manuales, Z chunks
     ```

5. **Actualizar TODO.md:**
   - Marcar todas las subtareas de FASE 1 (líneas 15-79) como [x]
   - Agregar timestamp de completion

**Success criteria:**
- ✅ Archivo docs/uuid-snapshot-YYYYMMDD.md creado
- ✅ Estado de uuid-ossp documentado
- ✅ Todas las verificaciones pasadas
- ✅ TODO.md actualizado

Por favor, ejecuta estas tareas usando tus MCP tools y proporciona reporte detallado.
```

---

## 🗄️ FASE 2: Implementación Database
**🟣 Responsable:** `@database-agent`

### Prompt 2.1: Habilitar Extensión uuid-ossp

```
🟣 Continuando con @database-agent para FASE 2.1: Habilitar uuid-ossp

**Contexto previo:** FASE 1 completada. Ver resultados en `docs/uuid-snapshot-YYYYMMDD.md`.

**Tu responsabilidad:** Habilitar extensión uuid-ossp vía migration.

**Referencias:**
- plan.md (líneas 182-201) - FASE 2 especificación
- TODO.md (líneas 85-119) - Checklist subtarea 2.1

**Acciones requeridas:**

1. **Crear y aplicar migration usando mcp__supabase__apply_migration:**
   - Nombre: `enable_uuid_ossp`
   - Query SQL:
     ```sql
     CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

     COMMENT ON EXTENSION "uuid-ossp" IS
       'Enables UUID generation functions including uuid_generate_v5() for deterministic UUIDs';
     ```

2. **Validar extensión habilitada:**
   ```sql
   -- Test básico
   SELECT uuid_generate_v5(
     'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
     'test'
   );
   ```
   - Debe retornar UUID válido

3. **Verificar con mcp__supabase__list_extensions:**
   - Confirmar que uuid-ossp aparece en la lista

4. **Actualizar TODO.md:**
   - Marcar todas las subtareas 2.1 (líneas 86-119) como [x]

**Success criteria:**
- ✅ Migration aplicada exitosamente
- ✅ uuid_generate_v5() funciona
- ✅ Extensión visible en list_extensions
- ✅ TODO.md actualizado

Por favor, ejecuta la migration y valida que funciona correctamente.
```

### Prompt 2.2: Crear Función Determinística

```
🟣 Continuando con @database-agent para FASE 2.2-2.3: Función Determinística

**Contexto:** Extensión uuid-ossp habilitada y validada.

**Tu responsabilidad:** Crear función hotels.generate_deterministic_uuid() y ejecutar 4 tests de validación.

**Referencias:**
- plan.md (líneas 92-108) - Implementación exacta de la función
- TODO.md (líneas 120-199) - Checklist completa FASE 2.2-2.3

**Acciones requeridas:**

1. **Crear migration con la función usando mcp__supabase__apply_migration:**
   - Nombre: `add_deterministic_uuid_function`
   - Query SQL (copiar exacto de plan.md líneas 92-108):
     ```sql
     CREATE OR REPLACE FUNCTION hotels.generate_deterministic_uuid(
       p_tenant_id VARCHAR,
       p_motopress_unit_id INTEGER
     )
     RETURNS UUID
     LANGUAGE plpgsql
     IMMUTABLE  -- CRÍTICO: Garantiza mismo output para mismo input
     SECURITY DEFINER
     SET search_path = hotels, public
     AS $$
     BEGIN
       -- Validar inputs
       IF p_tenant_id IS NULL OR p_motopress_unit_id IS NULL THEN
         RAISE EXCEPTION 'tenant_id and motopress_unit_id cannot be NULL';
       END IF;

       -- Generar UUID determinístico usando namespace + clave compuesta
       RETURN uuid_generate_v5(
         'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,  -- Namespace fijo para accommodations
         p_tenant_id || ':motopress:' || p_motopress_unit_id::text
       );
     END;
     $$;

     COMMENT ON FUNCTION hotels.generate_deterministic_uuid IS
       'Generates deterministic UUID v5 for accommodation units based on tenant_id and motopress_unit_id.
        Same inputs always produce same UUID, ensuring stability across database rebuilds.
        RFC 4122 compliant.';
     ```

2. **Ejecutar 4 tests de validación (TODO.md líneas 162-199):**

   **Test 1: Reproducibilidad**
   ```sql
   -- Ejecutar 3 veces, anotar UUIDs
   SELECT hotels.generate_deterministic_uuid(
     'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf',
     307
   ) as uuid_test;
   ```
   Esperado: Mismo UUID en las 3 ejecuciones

   **Test 2: Unicidad**
   ```sql
   SELECT
     hotels.generate_deterministic_uuid('b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf', 307) as summertime_uuid,
     hotels.generate_deterministic_uuid('b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf', 308) as other_uuid;
   ```
   Esperado: UUIDs diferentes

   **Test 3: Validación NULL**
   ```sql
   SELECT hotels.generate_deterministic_uuid(NULL, 307);
   ```
   Esperado: ERROR "tenant_id and motopress_unit_id cannot be NULL"

   **Test 4: Performance**
   ```sql
   EXPLAIN ANALYZE
   SELECT hotels.generate_deterministic_uuid(
     'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf',
     307
   ) FROM generate_series(1, 1000);
   ```
   Esperado: < 100ms para 1000 llamadas

3. **Documentar resultados:**
   - Crear tabla con resultados de cada test
   - Confirmar todos los tests pasan

4. **Actualizar TODO.md:**
   - Marcar todas las subtareas 2.2-2.3 (líneas 120-199) como [x]
   - Marcar Milestone 2 completado

**Success criteria:**
- ✅ Migration aplicada exitosamente
- ✅ Función creada con IMMUTABLE attribute
- ✅ 4/4 tests pasan
- ✅ Performance < 100ms
- ✅ TODO.md actualizado

Por favor, crea la función y ejecuta todos los tests de validación.
```

---

## 🔧 FASE 3: Actualización de Sync Manager
**🟠 Responsable:** @backend-developer

### Prompt 3.1: Modificar Sync Manager

```
🟠 Invocando @backend-developer para FASE 3: Actualización Sync Manager

**Contexto:** Función hotels.generate_deterministic_uuid() creada y testeada (ver FASE 2 completada).

**Tu responsabilidad:** Modificar sync-manager.ts para usar UUIDs determinísticos en INSERT statements.

**Referencias:**
- plan.md (líneas 205-239) - FASE 3 con ejemplos de código
- TODO.md (líneas 203-265) - Checklist completa FASE 3
- Archivo a modificar: `src/lib/integrations/motopress/sync-manager.ts`

**Acciones requeridas:**

1. **Crear backup del archivo original:**
   ```bash
   cp src/lib/integrations/motopress/sync-manager.ts \
      src/lib/integrations/motopress/sync-manager.ts.backup-$(date +%Y%m%d)
   ```

2. **Modificar función syncAccommodations() en línea 211:**

   Buscar INSERT statement:
   ```typescript
   const insertSql = `
     INSERT INTO hotels.accommodation_units (
       hotel_id, tenant_id, motopress_unit_id, name, description, ...
     ) VALUES (
       '${hotelId}', '${tenantId}', ${unit.motopress_unit_id}, ...
     )
   `
   ```

   Reemplazar con:
   ```typescript
   const insertSql = `
     INSERT INTO hotels.accommodation_units (
       id,  -- ⭐ NUEVO: Especificar ID explícitamente
       hotel_id, tenant_id, motopress_unit_id, name, description, ...
     ) VALUES (
       hotels.generate_deterministic_uuid('${tenantId}', ${unit.motopress_unit_id}),  -- ⭐ NUEVO
       '${hotelId}', '${tenantId}', ${unit.motopress_unit_id}, ...
     )
   `
   ```

   ⚠️ **NO modificar UPDATE statements** (líneas ~183-207) - Solo INSERT debe usar UUID determinístico

3. **Modificar función syncSelectedAccommodations() en línea 564:**
   - Aplicar el MISMO cambio que en paso 2
   - Agregar campo `id` al INSERT
   - Valor: `hotels.generate_deterministic_uuid('${tenantId}', ${unit.motopress_unit_id})`

4. **Validar código:**
   ```bash
   # TypeScript compilation
   npm run type-check

   # Linting
   npx eslint src/lib/integrations/motopress/sync-manager.ts
   ```
   Esperado: 0 errores, 0 warnings

5. **Actualizar TODO.md:**
   - Marcar todas las subtareas FASE 3 (líneas 203-265) como [x]
   - Marcar Milestone 3 completado

**Success criteria:**
- ✅ Backup creado
- ✅ 2 INSERT statements modificados (líneas 211 y 564)
- ✅ UPDATE statements SIN modificar
- ✅ TypeScript compila sin errores
- ✅ ESLint pasa sin warnings
- ✅ TODO.md actualizado

Por favor, modifica el sync-manager.ts según las especificaciones y valida el código.
```

---

## 🧪 FASE 4: Testing y Validación
**🔴 Responsable:** `@infrastructure-monitor` + **🟣** @database-agent

### Prompt 4.1: Test Crítico de Idempotencia

```
🔴 Invocando @infrastructure-monitor + 🟣 @database-agent para FASE 4.1: Test de Idempotencia

**Contexto:** Sync manager modificado y código validado (FASE 3 completada).

**Tu responsabilidad:** Ejecutar test CRÍTICO de idempotencia DELETE + re-sync → mismo UUID.

**Referencias:**
- plan.md (líneas 243-259) - Test de idempotencia especificado
- TODO.md (líneas 269-323) - Checklist paso a paso

**🚨 ADVERTENCIA:** Este test es DESTRUCTIVO - borrará Summertime temporalmente.

**Acciones requeridas:**

1. **Paso 1: Obtener UUID actual (database-agent):**
   ```sql
   SELECT id FROM hotels.accommodation_units
   WHERE name = 'Summertime' AND tenant_id = 'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf';
   ```
   - Anotar UUID actual: `_________________`

2. **Paso 2: Calcular UUID esperado (database-agent):**
   ```sql
   SELECT hotels.generate_deterministic_uuid(
     'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf',
     307
   );
   ```
   - Anotar UUID esperado: `_________________`

3. **Paso 3: Borrar Summertime con dependencias (database-agent):**
   ```sql
   -- Borrar en orden correcto (FK constraints)
   DELETE FROM accommodation_units_manual_chunks
   WHERE accommodation_unit_id = (
     SELECT id FROM hotels.accommodation_units WHERE name = 'Summertime'
   );

   DELETE FROM accommodation_units_manual
   WHERE unit_id = (
     SELECT id FROM hotels.accommodation_units WHERE name = 'Summertime'
   );

   DELETE FROM guest_reservations
   WHERE accommodation_unit_id = (
     SELECT id FROM hotels.accommodation_units WHERE name = 'Summertime'
   );

   DELETE FROM hotels.accommodation_units
   WHERE name = 'Summertime';
   ```

4. **Paso 4: Re-sincronizar Summertime:**
   ```bash
   npx tsx scripts/sync-all-accommodations.ts
   ```
   - Monitorear logs para errores

5. **Paso 5: Verificar UUID es determinístico (CRÍTICO):**
   ```sql
   SELECT id FROM hotels.accommodation_units
   WHERE name = 'Summertime';
   ```
   - Comparar con UUID esperado del Paso 2
   - ✅ **PASS:** UUIDs coinciden
   - ❌ **FAIL:** UUIDs diferentes → STOP y reportar

6. **Performance baseline (infrastructure-monitor):**
   ```sql
   EXPLAIN ANALYZE
   INSERT INTO hotels.accommodation_units (
     id, hotel_id, tenant_id, motopress_unit_id, name, status
   ) VALUES (
     hotels.generate_deterministic_uuid('b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf', 999),
     'test-hotel', 'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf', 999, 'Test Unit', 'active'
   );
   ```
   - Documentar execution time: _____ ms
   - Esperado: < 5ms
   - Cleanup: `DELETE FROM hotels.accommodation_units WHERE motopress_unit_id = 999;`

7. **Actualizar TODO.md:**
   - Marcar subtarea 4.1 (líneas 273-323) como [x]

**Success criteria:**
- ✅ UUID antes DELETE = UUID después re-sync (IDEMPOTENCIA CONFIRMADA)
- ✅ Performance < 5ms
- ✅ No errores en re-sync
- ✅ TODO.md actualizado

Por favor, ejecuta el test de idempotencia y reporta resultados detallados.
```

### Prompt 4.2: Tests Complementarios

```
🟣 Continuando con @database-agent para FASE 4.2-4.3: Tests de Integridad

**Contexto:** Test de idempotencia PASSED (Summertime UUID estable).

**Tu responsabilidad:** Validar guest_reservations y manual_chunks funcionan con nuevos UUIDs.

**Referencias:**
- TODO.md (líneas 325-368) - Tests 4.2 y 4.3

**Acciones requeridas:**

1. **Test 4.2: Guest Reservations (líneas 325-345):**
   ```bash
   # Re-sincronizar bookings
   npx tsx scripts/sync-motopress-bookings.ts b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf
   ```

   Validar association:
   ```sql
   SELECT
     gr.id,
     gr.guest_name,
     gr.accommodation_unit_id,
     au.name as unit_name
   FROM guest_reservations gr
   JOIN hotels.accommodation_units au ON au.id = gr.accommodation_unit_id
   WHERE au.name = 'Summertime'
   LIMIT 3;
   ```
   - ✅ **PASS:** JOIN funciona, unit_name = 'Summertime'
   - ❌ **FAIL:** NULL o unit_name incorrecto

2. **Test 4.3: Manual Chunks (líneas 347-368):**
   ```bash
   # Re-procesar manuales
   node scripts/process-accommodation-manuals.js

   # Re-chunkear
   node scripts/migrate-manual-to-chunks.js
   ```

   Validar chunks:
   ```sql
   SELECT COUNT(*) as chunk_count
   FROM accommodation_units_manual_chunks
   WHERE accommodation_unit_id = (
     SELECT id FROM hotels.accommodation_units WHERE name = 'Summertime'
   );
   ```
   - Esperado: 8 chunks
   - ✅ **PASS:** Count = 8
   - ❌ **FAIL:** Count diferente

3. **Actualizar TODO.md:**
   - Marcar subtareas 4.2-4.3 (líneas 325-368) como [x]

**Success criteria:**
- ✅ Guest reservations asociadas correctamente
- ✅ Manual chunks accesibles (count = 8)
- ✅ TODO.md actualizado

Por favor, ejecuta estos tests y reporta resultados.
```

### Prompt 4.3: Test End-to-End Guest Chat

```
🔴 Invocando @infrastructure-monitor para FASE 4.4: Test E2E Guest Chat

**Contexto:** Integridad de datos validada (guest_reservations y chunks OK).

**Tu responsabilidad:** Validar que el sistema funciona end-to-end con guest chat.

**Referencias:**
- TODO.md (líneas 370-417) - Test E2E especificado

**Acciones requeridas:**

1. **Crear test script:**
   ```bash
   cat > test-uuid-stability.js << 'EOF'
   import fetch from 'node-fetch'

   async function testGuestChat() {
     // 1. Login
     const loginRes = await fetch('http://localhost:3000/api/guest/login', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         tenant_id: 'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf',
         check_in_date: '2025-12-26',
         phone_last_4: '0000'
       })
     })
     const login = await loginRes.json()
     console.log('Login:', login.success ? '✅' : '❌')

     // 2. Chat query
     const chatRes = await fetch('http://localhost:3000/api/guest/chat', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${login.token}`
       },
       body: JSON.stringify({ message: 'Cuál es la contraseña del WiFi?' })
     })
     const chat = await chatRes.json()

     // 3. Validate
     const hasPassword = chat.response?.includes('Summer2024Time!')
     console.log('WiFi password found:', hasPassword ? '✅' : '❌')
     console.log('Response:', chat.response?.slice(0, 100))
   }

   testGuestChat().catch(console.error)
   EOF
   ```

2. **Ejecutar test:**
   ```bash
   node test-uuid-stability.js
   ```
   - Esperado: ✅ Login + ✅ WiFi password found
   - ✅ **PASS:** Sistema funciona end-to-end
   - ❌ **FAIL:** Revisar logs y reportar error

3. **Health checks (infrastructure-monitor):**
   ```bash
   # Validar endpoints funcionando
   curl http://localhost:3000/api/health
   ```
   - Esperado: 200 OK

4. **Actualizar TODO.md:**
   - Marcar subtareas 4.4-4.5 (líneas 370-433) como [x]
   - Marcar Milestone 4 completado

**Success criteria:**
- ✅ Test E2E pasa completamente
- ✅ WiFi password se encuentra en respuesta
- ✅ Health checks OK
- ✅ TODO.md actualizado

Por favor, ejecuta el test E2E y valida el sistema funciona correctamente.
```

---

## 🚨 FASE 5: Migración de Datos Existentes (OPCIONAL)
**🟣 Responsable:** @database-agent

### Prompt 5.0: Decisión de Migración

```
🟣 Consultando @database-agent para FASE 5: Decisión de Migración

**Contexto:** Todos los tests pasan (FASE 4 completada). Sistema funciona con UUIDs determinísticos para NUEVOS registros.

**Tu responsabilidad:** Ayudar a evaluar si migrar UUIDs existentes a determinísticos.

**Referencia:** TODO.md (líneas 430-461) - Decisión de migración

**Evaluación requerida:**

1. **Estado actual del sistema:**
   - ✅ Nuevos accommodations usan UUID determinístico
   - ✅ Sistema funciona correctamente
   - ℹ️ Registros existentes mantienen UUIDs aleatorios originales

2. **Razones para NO migrar (recomendado):**
   - Sistema funciona con mezcla (viejos aleatorios + nuevos determinísticos)
   - Nuevos registros ya usan UUID determinístico (objetivo logrado)
   - Zero downtime, zero risk
   - Backward compatible al 100%

3. **Razones para SÍ migrar:**
   - Quieres consistencia 100% en todos los UUIDs
   - Analytics/reporting requiere IDs estables retroactivamente
   - URLs públicas deben ser permanentes para TODOS los registros existentes

4. **Riesgos de migrar:**
   - ⚠️ DESTRUCTIVO: Cambia todos los UUIDs existentes
   - ⚠️ Requiere ventana de mantenimiento
   - ⚠️ Posible rotura de referencias externas cacheadas
   - ⚠️ Rollback complejo

**Pregunta al usuario:**
¿Deseas migrar UUIDs existentes a determinísticos?
- [ ] NO MIGRAR (recomendado) → Skip resto de FASE 5, ir a FASE 6
- [ ] SÍ MIGRAR → Continuar con Prompt 5.1

**Por favor, consulta con el usuario y documenta la decisión en TODO.md (línea 449).**
```

### Prompt 5.1: Ejecución de Migración (SOLO SI SE DECIDE MIGRAR)

```
🟣 ADVERTENCIA: @database-agent ejecutando FASE 5: Migración DESTRUCTIVA

⚠️ **ESTE PROMPT SOLO SE USA SI EL USUARIO DECIDIÓ MIGRAR**

**Contexto:** Usuario confirmó migrar UUIDs existentes a determinísticos.

**Tu responsabilidad:** Ejecutar migración completa con backup y rollback capability.

**Referencias:**
- plan.md (líneas 291-313) - FASE 5 especificación
- TODO.md (líneas 463-586) - Checklist completa migración

**🚨 PRE-REQUISITO: Ventana de mantenimiento activa**

**Acciones requeridas:**

1. **Pre-migración: Crear backup (líneas 463-482):**
   ```sql
   CREATE TABLE hotels.accommodation_units_uuid_backup AS
   SELECT
     id as old_id,
     hotels.generate_deterministic_uuid(tenant_id, motopress_unit_id) as new_id,
     tenant_id,
     motopress_unit_id,
     name
   FROM hotels.accommodation_units;

   -- Validar backup
   SELECT COUNT(*) FROM hotels.accommodation_units_uuid_backup;
   ```

2. **Crear script de rollback:**
   ```bash
   cat > scripts/rollback-uuid-migration.sql << 'EOF'
   UPDATE hotels.accommodation_units au
   SET id = b.old_id
   FROM hotels.accommodation_units_uuid_backup b
   WHERE au.motopress_unit_id = b.motopress_unit_id
     AND au.tenant_id = b.tenant_id;

   SELECT 'Rollback completado' as status;
   EOF
   ```

3. **Ejecutar migración (líneas 497-519):**
   ```sql
   -- Actualizar UUIDs a determinísticos
   UPDATE hotels.accommodation_units au
   SET id = hotels.generate_deterministic_uuid(au.tenant_id, au.motopress_unit_id);

   -- Verificar unicidad
   SELECT
     COUNT(*) as total,
     COUNT(DISTINCT id) as unique_ids
   FROM hotels.accommodation_units;
   -- total DEBE = unique_ids (no duplicados)
   ```

4. **Validación post-migración (líneas 521-566):**

   **Test 1: Verificar FKs:**
   ```sql
   -- guest_reservations
   SELECT COUNT(*)
   FROM guest_reservations gr
   LEFT JOIN hotels.accommodation_units au ON au.id = gr.accommodation_unit_id
   WHERE gr.accommodation_unit_id IS NOT NULL AND au.id IS NULL;
   -- Esperado: 0

   -- accommodation_units_manual
   SELECT COUNT(*)
   FROM accommodation_units_manual m
   LEFT JOIN hotels.accommodation_units au ON au.id = m.unit_id
   WHERE au.id IS NULL;
   -- Esperado: 0

   -- accommodation_units_manual_chunks
   SELECT COUNT(*)
   FROM accommodation_units_manual_chunks c
   LEFT JOIN hotels.accommodation_units au ON au.id = c.accommodation_unit_id
   WHERE au.id IS NULL;
   -- Esperado: 0
   ```

   **Test 2: Guest chat funciona:**
   ```bash
   node test-uuid-stability.js
   ```

   **Test 3: Comparar con backup:**
   ```sql
   SELECT
     b.name,
     b.old_id,
     au.id as new_id,
     (b.new_id = au.id) as uuid_matches_expected
   FROM hotels.accommodation_units_uuid_backup b
   JOIN hotels.accommodation_units au
     ON au.motopress_unit_id = b.motopress_unit_id
     AND au.tenant_id = b.tenant_id
   WHERE b.new_id != au.id;
   -- Esperado: 0 rows (todos coinciden)
   ```

5. **SI ALGO FALLA - Rollback inmediato (líneas 568-586):**
   ```bash
   psql < scripts/rollback-uuid-migration.sql
   ```

6. **Actualizar TODO.md:**
   - Marcar todas las subtareas FASE 5 como [x]
   - Marcar Milestone 5 completado
   - Documentar decisión y resultado

**Success criteria:**
- ✅ Backup creado exitosamente
- ✅ Migración ejecutada sin duplicados
- ✅ 3/3 tests de validación pasan
- ✅ TODO.md actualizado

**SI FALLA CUALQUIER TEST:** Ejecutar rollback inmediatamente y reportar.

Por favor, ejecuta la migración con extremo cuidado y valida cada paso.
```

---

## 📝 FASE 6: Deploy y Documentación
**🟣 Responsable:** @deploy-agent (coordinador) + todos

### Prompt 6.1: Deploy Automático

```
🟣 Invocando @deploy-agent para FASE 6: Deploy y Documentación

**Contexto:** Testing completado exitosamente (FASE 4 OK). Migración opcional ejecutada o skippeada según decisión (FASE 5).

**Tu responsabilidad:** Ejecutar deploy automático a producción con verificación completa.

**Referencias:**
- plan.md (líneas 317-338) - FASE 6 especificación
- TODO.md (líneas 588-708) - Checklist FASE 6

**Acciones requeridas:**

1. **Ejecutar deploy-agent automático:**
   ```bash
   npm run deploy-agent
   ```

   El deploy-agent ejecutará automáticamente:
   - ✅ Commit con mensaje descriptivo
   - ✅ Push a GitHub
   - ✅ Monitoreo de Vercel deploy
   - ✅ Verificación funcional completa:
     - /api/health → 200 OK
     - /api/chat → funcionando
     - /api/muva/chat → funcionando
   - ✅ Reporte con métricas de performance

2. **Validar deploy exitoso:**
   - Verificar URL producción: https://innpilot.vercel.app
   - Confirmar todos los endpoints responden 200
   - Performance dentro de baselines

3. **Si deploy-agent falla, fallback manual:**
   ```bash
   # Commit manual
   git add .
   git commit -m "feat: implement deterministic UUIDs for accommodation_units

   - Add hotels.generate_deterministic_uuid() function (RFC 4122 UUID v5)
   - Update sync-manager.ts to use deterministic UUIDs for new records
   - Ensure UUID stability across re-synchronizations
   - Backward compatible: existing records keep their UUIDs

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"

   # Push y monitorear
   git push origin main
   ```

4. **Actualizar TODO.md:**
   - Marcar subtarea 6.1 (líneas 594-609) como [x]

**Success criteria:**
- ✅ Deploy completado exitosamente
- ✅ Health checks pasan en producción
- ✅ Performance OK
- ✅ TODO.md actualizado

Por favor, ejecuta el deploy y reporta status completo.
```

### Prompt 6.2: Documentación Final

```
🟣 Finalizando con @database-agent + todos para FASE 6.2-6.4: Documentación

**Contexto:** Deploy exitoso en producción.

**Tu responsabilidad:** Completar documentación y limpieza final.

**Referencias:**
- TODO.md (líneas 611-708) - Documentación final

**Acciones requeridas:**

1. **Actualizar CHANGELOG.md (líneas 612-627):**
   ```markdown
   ## [2025-10-02] - UUIDs Determinísticos
   ### Added
   - Función `hotels.generate_deterministic_uuid()` para generar UUIDs estables
   - UUIDs ahora basados en tenant_id + motopress_unit_id (RFC 4122 UUID v5)

   ### Changed
   - Sync manager usa UUIDs determinísticos para nuevos accommodations
   - Garantiza estabilidad de IDs en re-sincronizaciones

   ### Technical Details
   - Extensión uuid-ossp habilitada
   - Función IMMUTABLE garantiza reproducibilidad
   - Backward compatible: registros existentes mantienen sus UUIDs
   ```

2. **Crear docs/DETERMINISTIC_UUIDS.md:**
   - Explicar concepto de UUIDs determinísticos
   - Documentar namespace usado: `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11`
   - Incluir ejemplos de uso
   - Explicar ventajas y casos de uso

3. **Limpiar archivos temporales (líneas 638-656):**
   ```bash
   # Remover test scripts
   rm test-uuid-stability.js

   # Consolidar backups
   mkdir -p backups/uuid-migration-$(date +%Y%m%d)
   mv backups/pre-deterministic-uuid-*.sql backups/uuid-migration-$(date +%Y%m%d)/ 2>/dev/null || true
   mv src/lib/integrations/motopress/sync-manager.ts.backup-* backups/uuid-migration-$(date +%Y%m%d)/ 2>/dev/null || true
   ```

4. **Actualizar TODO.md final (líneas 658-665):**
   - Marcar TODAS las tareas como [x]
   - Documentar tiempo total: _____ horas
   - Documentar issues encontrados (si hubo)
   - Cambiar estado global a: ✅ COMPLETADO
   - Marcar Milestone 6 completado

5. **Actualizar tabla de progreso (líneas 670-680):**
   - Marcar todas las fases como ✅ Completado
   - Documentar tiempo real de cada fase

**Success criteria:**
- ✅ CHANGELOG.md actualizado
- ✅ docs/DETERMINISTIC_UUIDS.md creado
- ✅ Archivos temporales limpiados
- ✅ TODO.md estado = COMPLETADO
- ✅ Backups consolidados

Por favor, completa la documentación final y cierra el proceso.
```

---

## 🔧 Troubleshooting

### Error: uuid-ossp no disponible
```
Solución: Contactar soporte Supabase para habilitar extensión.
Alternativa: Usar uuid_generate_v4() temporalmente (no determinístico).
```

### Error: Función genera UUIDs diferentes cada vez
```
Diagnóstico: Falta IMMUTABLE attribute
Solución: Recrear función con IMMUTABLE (plan.md línea 100)
```

### Error: TypeScript compilation fails
```
Diagnóstico: Sintaxis incorrecta en sync-manager.ts
Solución: Restaurar backup y re-aplicar cambios cuidadosamente
```

### Error: Test de idempotencia falla (UUIDs diferentes)
```
Diagnóstico: sync-manager.ts no está usando generate_deterministic_uuid()
Solución: Verificar INSERT statements tienen campo id con función determinística
```

### Error: Deploy-agent falla
```
Solución: Usar commit manual (Prompt 6.1, sección fallback)
Verificar: git status, resolver conflictos si existen
```

---

## ✅ Checklist de Uso

**Antes de comenzar:**
- [ ] Leer plan.md completo (líneas 1-338)
- [ ] Revisar TODO.md para entender todas las fases
- [ ] Verificar environment está listo (dev server corriendo)

**Durante ejecución:**
- [ ] Ejecutar prompts EN ORDEN (1.1 → 2.1 → 2.2 → 3.1 → 4.1 → 4.2 → 4.3 → [5.0] → 6.1 → 6.2)
- [ ] Marcar cada fase en TODO.md antes de continuar
- [ ] NO saltarse validaciones
- [ ] Documentar cualquier issue encontrado

**Decisión FASE 5:**
- [ ] Evaluar con Prompt 5.0
- [ ] SI NO MIGRAR: Skip Prompt 5.1, ir directo a Prompt 6.1
- [ ] SI SÍ MIGRAR: Ejecutar Prompt 5.1 con extremo cuidado

**Al finalizar:**
- [ ] Verificar TODO.md estado = ✅ COMPLETADO
- [ ] Confirmar deploy en producción funcionando
- [ ] Documentación completa (CHANGELOG + docs/DETERMINISTIC_UUIDS.md)
- [ ] Backups consolidados

---

**Última actualización:** 2025-10-02
**Total de prompts:** 10 (6 principales + 4 opcionales)
**Tiempo estimado total:** 4-6 horas (sin FASE 5) | 6-8 horas (con FASE 5)
