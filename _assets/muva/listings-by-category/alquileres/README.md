# Alquileres - San Andrés

Esta carpeta contiene todos los listings de servicios de alquiler organizados con el schema específico `AlquilerListing`.

## Estructura de Archivos

Cada archivo JSON en esta carpeta representa un servicio de alquiler individual con los siguientes campos específicos:

- `tipo_alquiler`: Qué se alquila (scooter, bicicleta, equipo de buceo, etc.)
- `modalidades_alquiler`: Por horas, días, semanas
- `precios_por_periodo`: Estructura de precios según duración
- `deposito_requerido`: Depósito de garantía
- `documentos_requeridos`: Documentación necesaria
- `seguro_incluido`: Si incluye cobertura de seguro

## Schema TypeScript

Ver: `_assets/muva/schemas/alquiler.schema.ts`

## Total de Listings

*Se actualizará automáticamente durante el procesamiento*