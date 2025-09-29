# Spots - San Andrés

Esta carpeta contiene todos los listings de lugares de interés (spots) organizados con el schema específico `SpotListing`.

## Estructura de Archivos

Cada archivo JSON en esta carpeta representa un spot individual con los siguientes campos específicos:

- `tipo_spot`: Tipo de lugar (playa, mirador, formación natural, etc.)
- `mejor_momento_dia`: Mejores horas para visitar
- `actividades_principales`: Qué se puede hacer en el lugar
- `vistas_disponibles`: Tipos de vistas desde el lugar
- `nivel_concurrencia`: Qué tan concurrido está
- `ideal_familias`, `ideal_parejas`: Para qué tipo de visitantes es ideal

## Schema TypeScript

Ver: `_assets/muva/schemas/spot.schema.ts`

## Total de Listings

*Se actualizará automáticamente durante el procesamiento*