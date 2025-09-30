# ⚠️ DEPRECATED TEMPLATES

**Fecha de deprecación:** Septiembre 2025
**Razón:** Metadata optimization y consolidación de templates

---

## 🚫 TEMPLATES OBSOLETAS EN ESTA CARPETA

### 1. `muva-documentation-template.md`
**Problema:**
- ❌ Demasiado compleja (233 líneas)
- ❌ Formato Q&A innecesariamente verbose
- ❌ Subcategorías genéricas ("general")
- ❌ Tags sin estrategia bilingüe
- ❌ Metadata no alineada con sistema actual

**Reemplazada por:** `_assets/muva/MUVA_LISTING_TEMPLATE_V2.md`

### 2. `muva-listing-template.md`
**Problema:**
- ❌ Subcategoría "deportes_acuaticos" muy genérica
- ❌ Tags no bilingües ni semánticos
- ❌ No refleja las 17 subcategorías específicas implementadas
- ❌ Falta estrategia clara de tags vs keywords

**Reemplazada por:** `_assets/muva/MUVA_LISTING_TEMPLATE_V2.md`

---

## ✅ USA EN SU LUGAR

### **Nueva Template Consolidada:**
```
_assets/muva/MUVA_LISTING_TEMPLATE_V2.md
```

### **Guía Completa:**
```
docs/MUVA_TEMPLATE_GUIDE.md
```

### **Reporte de Optimización:**
```
docs/METADATA_OPTIMIZATION_REPORT.md
```

---

## 🎯 VENTAJAS DE LA NUEVA TEMPLATE V2.0

✅ **17 subcategorías específicas** (vs 1 genérica)
✅ **Tags bilingües semánticos** (Español + Inglés)
✅ **Simple y clara** (100-120 líneas vs 233)
✅ **Estrategia tags vs keywords** documentada
✅ **Ejemplos completos** por cada categoría
✅ **Compatible** con Matryoshka Embeddings + Metadata Optimization

---

## 📊 COMPARACIÓN

| Aspecto | Template Antigua | Template V2.0 |
|---------|-----------------|---------------|
| **Longitud** | 233 líneas | 120 líneas ✅ |
| **Subcategorías** | 1 genérica | 17 específicas ✅ |
| **Tags** | No bilingües | Bilingües ✅ |
| **Estrategia** | No documentada | Documentada ✅ |
| **Ejemplos** | Genéricos | 5 completos ✅ |
| **Formato** | Q&A verbose | Directo ✅ |

---

## 🔄 MIGRACIÓN

Si tienes documentos usando templates antiguas:

### **Paso 1: Actualizar Frontmatter**

**Antes:**
```yaml
document:
  subcategory: deportes_acuaticos  # ← Genérico
  tags: [surf, actividades]        # ← No bilingüe
```

**Después:**
```yaml
document:
  subcategory: surf                          # ← Específico
  tags: [surf, surfing, lessons, waves, clases_surf, principiantes]  # ← Bilingüe
```

### **Paso 2: Consultar Guía de Subcategorías**

Ver: `docs/MUVA_TEMPLATE_GUIDE.md` - Sección "Guía de Subcategorías"

### **Paso 3: Aplicar Estrategia de Tags**

Ver: `docs/MUVA_TEMPLATE_GUIDE.md` - Sección "Estrategia de Tags"

### **Paso 4: Regenerar Embeddings**

```bash
node scripts/populate-embeddings.js tu-archivo-actualizado.md
```

---

## ❓ ¿POR QUÉ SE DEPRECARON?

### **Razones Técnicas:**

1. **Metadata Optimization (Sept 2025)**
   - Sistema ahora usa 17 subcategorías específicas
   - Tags bilingües mejoran recall 10%
   - Post-filtrado en memoria sin latencia adicional

2. **Consolidación**
   - Dos templates conflictivas causaban confusión
   - Nueva template unifica best practices

3. **Performance**
   - Subcategorías específicas permiten filtrado granular
   - Tags semánticos mejoran relevancia de búsqueda
   - Compatible con Matryoshka multi-tier embeddings

### **Ver Reporte Completo:**
```
docs/METADATA_OPTIMIZATION_REPORT.md
```

---

## 📞 SOPORTE

Si tienes dudas sobre migración:

1. **Consulta la guía:** `docs/MUVA_TEMPLATE_GUIDE.md`
2. **Revisa ejemplos:** Ver sección "Ejemplos Completos" en template V2.0
3. **Verifica estructura:** `docs/METADATA_OPTIMIZATION_REPORT.md`

---

**Deprecation Date:** Septiembre 2025
**Status:** ⚠️ NO USAR ESTAS TEMPLATES
**Alternative:** `_assets/muva/MUVA_LISTING_TEMPLATE_V2.md`