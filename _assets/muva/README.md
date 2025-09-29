# MUVA - Listings de San Andrés

Este directorio contiene todos los listings de turismo de San Andrés organizados con arquitectura Domain-Driven Design (DDD) y schemas específicos por categoría.

## 🏗️ Arquitectura Completada

### ✅ Schemas TypeScript por Categoría
- **Base Schema**: `schemas/base.schema.ts` - Campos comunes
- **Restaurantes**: `schemas/restaurante.schema.ts` - Especializado en gastronomía
- **Actividades**: `schemas/actividad.schema.ts` - Tours y experiencias
- **Spots**: `schemas/spot.schema.ts` - Lugares de interés
- **Alquileres**: `schemas/alquiler.schema.ts` - Servicios de renta
- **Night Life**: `schemas/nightlife.schema.ts` - Vida nocturna

### ✅ Estructura de Datos Organizada
```
📁 _assets/muva/
├── 📊 data/
│   ├── unified/                    # Archivo completo unificado
│   └── exports/                    # Formatos optimizados
│       ├── muva-embeddings-format.json    # Para embeddings
│       ├── muva-search-index.json         # Para búsquedas
│       ├── muva-listings.csv              # Para análisis
│       └── by-category/                   # Separado por dominio
├── 📂 listings-by-category/        # Organizados por DDD
│   ├── restaurantes/   (6 listings)
│   ├── actividades/    (14 listings)
│   ├── spots/          (18 listings)
│   ├── alquileres/     (3 listings)
│   └── nightlife/      (1 listing)
└── 📝 schemas/                     # TypeScript interfaces
```

### ✅ Scripts de Procesamiento
- **`scripts/categorize-listings.js`** - Categorización inteligente automática
- **`scripts/export-unified.js`** - Generación de formatos unificados
- **`scripts/populate-muva-embeddings.js`** - Población de embeddings en tabla específica

## 🎯 Estado del Sistema

### Embeddings en Base de Datos ✅
- **Tabla**: `muva_content` (tabla específica para dominio MUVA)
- **Total**: 42 listings procesados
- **Distribución**:
  - Tourism (Spots): 18 embeddings
  - Activities (Actividades): 14 embeddings
  - Restaurants (Restaurantes): 6 embeddings
  - Transport (Alquileres): 3 embeddings
  - Culture (Night Life): 1 embedding

### Chat Integration Ready ✅
Los embeddings están listos para consultas en el chat de InnPilot:
- Vector search optimizado
- Contexto rico con metadatos de zona
- Filtros por categoría disponibles
- Esquemas específicos sin ruido de datos

## 🚀 Uso

### Para Desarrolladores
```typescript
import { RestauranteListing, ActividadListing } from '_assets/muva/schemas'

// Type-safe access con schemas específicos
const restaurante: RestauranteListing = {
  categoria: 'Restaurante',
  tipo_cocina: 'caribeña',
  rango_precios: 'medio'
  // ... otros campos específicos
}
```

### Para Scripts
```bash
# Recategorizar si se añaden nuevos listings
node scripts/categorize-listings.js

# Regenerar archivos unificados
node scripts/export-unified.js

# Actualizar embeddings en base de datos
node scripts/populate-muva-embeddings.js
```

### Para Chat Queries
Los usuarios pueden preguntar:
- "¿Dónde puedo bucear en San Andrés?"
- "Restaurantes en Rocky Cay"
- "Actividades para principiantes"
- "Spots románticos para parejas"

## 📈 Métricas del Proyecto

- **Listings Procesados**: 42
- **Categorías**: 5 dominios específicos
- **Schemas Creados**: 6 TypeScript interfaces
- **Scripts Desarrollados**: 3 herramientas de procesamiento
- **Arquitectura**: Domain-Driven Design implementada
- **Success Rate**: 100% embeddings procesados

## 🎉 Proyecto Completado

La arquitectura MUVA está lista para producción con:
- ✅ Schemas específicos por categoría
- ✅ Organización Domain-Driven
- ✅ Scripts de procesamiento automatizados
- ✅ Embeddings en tabla correcta
- ✅ Integración con chat lista
- ✅ Documentación completa