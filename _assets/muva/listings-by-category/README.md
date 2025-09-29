# Listings por Categoría - Arquitectura Domain-Driven

Esta estructura organiza los listings de MUVA usando principios de Domain-Driven Design (DDD), donde cada categoría de negocio tiene su propio dominio con esquemas específicos.

## Estructura de Directorios

```
listings-by-category/
├── restaurantes/          # Listings con RestauranteListing schema
├── actividades/          # Listings con ActividadListing schema
├── spots/                # Listings con SpotListing schema
├── alquileres/           # Listings con AlquilerListing schema
├── nightlife/            # Listings con NightLifeListing schema
└── README.md            # Este archivo
```

## Ventajas de esta Arquitectura

1. **Schemas Específicos**: Cada categoría tiene campos relevantes sin ruido de metadatos innecesarios
2. **Type Safety**: TypeScript interfaces específicas para cada dominio
3. **Escalabilidad**: Fácil agregar nuevas categorías sin afectar las existentes
4. **Queries Optimizadas**: Búsquedas focalizadas por tipo de negocio
5. **Mantenimiento**: Cambios en un dominio no afectan otros

## Categorías Disponibles

| Categoría | Schema | Descripción |
|-----------|--------|-------------|
| Restaurantes | `RestauranteListing` | Establecimientos gastronómicos |
| Actividades | `ActividadListing` | Experiencias y tours |
| Spots | `SpotListing` | Lugares de interés turístico |
| Alquileres | `AlquilerListing` | Servicios de renta |
| Night Life | `NightLifeListing` | Vida nocturna y entretenimiento |

## Uso

Los listings se categorizan automáticamente usando el script de categorización inteligente basado en:

- Campo `categoria` del listing original
- Análisis de contenido textual (descripción, nombre, tags)
- Patrones específicos de cada dominio

## Scripts Relacionados

- `scripts/categorize-listings.js` - Categorización inteligente
- `scripts/export-unified.js` - Genera archivo unificado cross-category
- `_assets/muva/schemas/` - Definiciones TypeScript de schemas