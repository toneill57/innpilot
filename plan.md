Updated Plan: Fix Units Tab & Validate Template System                                   │ │
│ │                                                                                          │ │
│ │ 🎯 OBJETIVO PRINCIPAL                                                                    │ │
│ │                                                                                          │ │
│ │ Verificar el workflow completo: Template processing → Embeddings generation → Units tab  │ │
│ │ display usando el archivo bien estructurado misty-morning.md.                            │ │
│ │                                                                                          │ │
│ │ 📋 FASES DE EJECUCIÓN PRIORITARIAS                                                       │ │
│ │                                                                                          │ │
│ │ FASE 1: Process Template File                                                            │ │
│ │                                                                                          │ │
│ │ - Usar embeddings-generator agent para procesar misty-morning.md                         │ │
│ │ - Aplicar sistema de extracción de template (25+ campos con HTML comments)               │ │
│ │ - Generar embeddings Matryoshka (Tier 1: 1024d, Tier 2: 1536d)                           │ │
│ │ - Insertar en tabla accommodation_units con hotel_id correcto                            │ │
│ │                                                                                          │ │
│ │ FASE 2: Verify Database Integration                                                      │ │
│ │                                                                                          │ │
│ │ - Establecer hotel_id = "238845ed-8c5b-4d33-9866-bb4e706b90b2" (SimmerDown Guest House)  │ │
│ │ - Verificar que todos los campos del template se extraen y almacenan correctamente       │ │
│ │ - Confirmar que embeddings se generan y se adjuntan                                      │ │
│ │                                                                                          │ │
│ │ FASE 3: Test Units Tab Display                                                           │ │
│ │                                                                                          │ │
│ │ - Refrescar Units tab y verificar muestra "1+ Units Active" (en lugar de "0 Units        │ │
│ │ Active")                                                                                 │ │
│ │ - Despliega "Apartamento Misty Morning" con todos los detalles                           │ │
│ │ - Muestra embedding status (Tier 1 & Tier 2)                                             │ │
│ │ - Pricing, amenidades y features se despliegan correctamente                             │ │
│ │                                                                                          │ │
│ │ FASE 4: Validate Complete System                                                         │ │
│ │                                                                                          │ │
│ │ - Verificar search performance con nueva unidad                                          │ │
│ │ - Confirmar que Matryoshka tier routing funciona                                         │ │
│ │ - Test vector search retorna resultados relevantes                                       │ │
│ │                                                                                          │ │
│ │ ✅ CRITERIOS DE ÉXITO                                                                     │ │
│ │                                                                                          │ │
│ │ - Units tab despliega la nueva accommodation unit                                        │ │
│ │ - Todos los campos del template poblados correctamente en base de datos                  │ │
│ │ - Embeddings generados y funcionales                                                     │ │
│ │ - Sistema listo para escalar a múltiples units                                           │ │
│ │                                                    

# Plan: Fix Units Tab & Validate Template System

## 🎯 OBJETIVO PRINCIPAL
Verificar el workflow completo: Template processing → Embeddings generation → Units tab display usando el archivo bien estructurado misty-morning.md.

## 📋 FASES DE EJECUCIÓN PRIORITARIAS

### **FASE 1: Process Template File**

1. **Usar embeddings-generator agent** para procesar misty-morning.md
   - Aplicar sistema de extracción de template (25+ campos con HTML comments)
   - Generar embeddings Matryoshka (Tier 1: 1024d, Tier 2: 1536d)
   - Insertar en tabla accommodation_units con hotel_id correcto

### **FASE 2: Verify Database Integration**

1. **Asegurar hotel linking correcto**
   - Establecer hotel_id = "238845ed-8c5b-4d33-9866-bb4e706b90b2" (SimmerDown Guest House)
   - Verificar que todos los campos del template se extraen y almacenan correctamente
   - Confirmar que embeddings se generan y se adjuntan

### **FASE 3: Test Units Tab Display**

1. **Refrescar Units tab y verificar:**
   - Muestra "1+ Units Active" (en lugar de "0 Units Active")
   - Despliega "Apartamento Misty Morning" con todos los detalles
   - Muestra embedding status (Tier 1 & Tier 2)
   - Pricing, amenidades y features se despliegan correctamente

### **FASE 4: Validate Complete System**

1. **Test embeddings functionality**
   - Verificar search performance con nueva unidad
   - Confirmar que Matryoshka tier routing funciona
   - Test vector search retorna resultados relevantes

## 🎯 RESULTADO ESPERADO

- **Units Tab**: Muestra accommodation unit activa correctamente
- **Template System**: Prueba que extracción de 25+ campos funciona perfectamente
- **Embeddings**: Confirma sistema Matryoshka operacional
- **Future Confidence**: Valida que imports de MotoPress funcionarán cuando hotel_id sea arreglado

## ✅ CRITERIOS DE ÉXITO

- Units tab despliega la nueva accommodation unit
- Todos los campos del template poblados correctamente en base de datos
- Embeddings generados y funcionales
- Sistema listo para escalar a múltiples units

## 🔧 ARCHIVOS CLAVE

### Template & Data
- `_assets/simmerdown/accommodations/apartments/misty-morning.md` ✅ (ready)
- `scripts/populate-embeddings.js` (embeddings generation)

### Units Display
- `src/components/Accommodation/AccommodationUnitsGrid.tsx` (Units tab component)
- `src/app/api/accommodation/units/route.ts` (Units API endpoint)

### Database Schema
- `accommodation_units` table (hotel_id linkage)
- Embedding columns (fast, balanced, full)

## 🚨 PROBLEMA ACTUAL IDENTIFICADO

**Units Tab Problem:**
- **Síntoma**: Units tab muestra "0 Units Active"
- **Causa Root**: `accommodation_units` tienen `hotel_id = null` pero componente filtra por `hotel_id` específico
- **Archivo**: `src/components/Accommodation/AccommodationUnitsGrid.tsx` filtra por `hotel_id=238845ed-8c5b-4d33-9866-bb4e706b90b2`

## ⚡ PRÓXIMOS PASOS INMEDIATOS

1. **Ejecutar embeddings-generator agent** con misty-morning.md
2. **Verificar hotel_id** durante procesamiento
3. **Fix Units tab** si hotel_id linkage está roto
4. **Validar workflow completo** end-to-end