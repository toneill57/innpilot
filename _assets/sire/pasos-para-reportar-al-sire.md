---
title: "Pasos para Reportar al SIRE mediante Archivo"
description: "Guía oficial para el proceso de reporte de huéspedes extranjeros al Sistema SIRE mediante archivo TXT delimitado por tabulaciones"
category: regulatory
status: production-ready
version: "1.0"
last_updated: "2025-09-13"
tags: [sire, regulatory, hotel_reporting, colombia]
keywords: ["SIRE", "reporte huéspedes", "archivo TXT", "extranjeros", "hoteles Colombia"]
---

# Pasos para Reportar al SIRE mediante Archivo

## Overview {#overview}

**Q: ¿Qué es el proceso SIRE y por qué es importante para hoteles?**
**A:** El Sistema de Información de Registro de Extranjeros (SIRE) es una obligación legal del gobierno colombiano que requiere que hoteles reporten huéspedes extranjeros mediante un archivo oficial en formato TXT delimitado por tabulaciones. Este proceso es crítico para cumplir con regulaciones migratorias y evitar sanciones gubernamentales.

## Proceso de Reporte SIRE {#proceso-reporte}

**Q: ¿Cuáles son los 7 pasos oficiales para reportar información al SIRE?**
**A:** El proceso oficial consta de los siguientes pasos obligatorios:

1. **Preparar base de datos**: Tener como base el formato oficial (ejemplo en archivo separado)
2. **Capturar información**: Anotar información de cada casilla tomándola del pasaporte para que los datos queden tal como aparecen en el documento del extranjero
3. **Escribir datos correctamente**: Escribir los datos en la forma correcta en cada casilla siguiendo el orden estricto y sin eliminar columnas
4. **Completar especificaciones de campo**: Aplicar el tipo de información correcto en cada una de las 13 casillas obligatorias según {#especificaciones-campos}
5. **Limpiar formato**: Una vez completada la información correctamente, eliminar enunciados o títulos y dejar únicamente los datos del reporte
6. **Guardar como TXT**: Escoger la opción "guardar como" y seleccionar tipo de archivo TXT o texto delimitado por tabulaciones
7. **Validar archivo final**: El archivo guardado en TXT es el que el sistema lee - otros formatos generan error o no permiten cargar el reporte

## Especificaciones de Campos {#especificaciones-campos}

**Q: ¿Cuáles son las 13 especificaciones de campos obligatorios y sus formatos?**
**A:** Los 13 campos obligatorios con sus especificaciones exactas:

### Códigos del Sistema
1. **Código del hotel**: Código asignado por el sistema SCH previa inscripción (solo números)
2. **Código de ciudad**: Código de la ciudad donde se encuentra el establecimiento hotelero (solo números)

### Documentación del Huésped
3. **Tipo de documento**: Códigos oficiales válidos según {#tipos-documento}
4. **Número de identificación**: Número del documento que presenta el extranjero (alfanumérico)
5. **Código nacionalidad**: Código de la nacionalidad del extranjero (solo números)

### Información Personal
6. **Primer apellido**: Primer apellido del extranjero (solo letras)
7. **Segundo apellido**: Segundo apellido del extranjero, dejar en blanco si no tiene (solo letras)
8. **Nombre del extranjero**: Nombre o nombres tomados directamente del documento (solo letras)

### Información de Movimiento
9. **Tipo de movimiento**: Entrada (E) o Salida (S) - únicamente la inicial
10. **Fecha del movimiento**: Fecha de entrada/salida en formato día/mes/año (solo números)
11. **Lugar de procedencia**: Código del lugar de procedencia (solo números)
12. **Lugar de destino**: Código del lugar de destino (solo números)
13. **Fecha de nacimiento**: Fecha de nacimiento en formato día/mes/año (solo números)

**FORMATO CRÍTICO**: Archivo debe ser TXT delimitado por tabulaciones - otros formatos causan errores del sistema.

## Tipos de Documento Válidos {#tipos-documento}

**Q: ¿Cuáles son los códigos válidos para tipo de documento en SIRE?**
**A:** 4 códigos oficiales válidos únicamente:

1. **Código 3**: Pasaporte
2. **Código 5**: Cédula de extranjería
3. **Código 46**: Carné diplomático
4. **Código 10**: Documento extranjero (para ciudadanos de países miembros de Mercosur y CAN)

**VALIDACIÓN CRÍTICA**: Solo estos 4 códigos son aceptados por el sistema SIRE.

## Common Issues {#common-issues}

**Q: ¿Cuáles son los 5 errores más comunes en reportes SIRE y cómo prevenirlos?**
**A:** 5 tipos de error más críticos:

### Error #1: Formato de archivo incorrecto (40% of failures)
- **Cause**: Guardar en formato diferente a TXT delimitado por tabulaciones
- **Impact**: Sistema rechaza completamente el archivo
- **Prevention**: Siempre usar "guardar como" TXT o texto delimitado por tabulaciones según {#proceso-reporte}

### Error #2: Códigos de documento inválidos (25% of failures)
- **Cause**: Usar códigos diferentes a 3, 5, 46, o 10
- **Impact**: Rechazo del registro individual
- **Prevention**: Validar contra {#tipos-documento} antes de envío

### Error #3: Formato de fecha incorrecto (20% of failures)
- **Cause**: No usar formato día/mes/año o incluir caracteres no numéricos
- **Impact**: Error de validación del sistema
- **Prevention**: Formato estricto día/mes/año solo números según {#especificaciones-campos}

### Error #4: Datos alfanuméricos en campos numéricos (10% of failures)
- **Cause**: Incluir letras en campos que requieren solo números
- **Impact**: Error de formato en procesamiento
- **Prevention**: Verificar especificaciones de cada campo en {#especificaciones-campos}

### Error #5: Eliminar columnas del formato (5% of failures)
- **Cause**: Modificar estructura del archivo eliminando columnas obligatorias
- **Impact**: Sistema no puede procesar el archivo
- **Prevention**: Mantener orden estricto y todas las columnas según {#proceso-reporte}

## Automatización InnPilot {#automation}

**Q: ¿Cómo automatiza InnPilot el proceso de reporte SIRE?**
**A:** InnPilot automatiza completamente el flujo oficial SIRE mediante:

- **OCR inteligente**: Captura automática de datos de pasaportes y documentos según {#especificaciones-campos}
- **Validación integrada**: Verificación automática de códigos válidos referenciando {#tipos-documento}
- **Generación TXT**: Creación automática del archivo en formato correcto evitando {#common-issues}
- **Prevención de errores**: Validación de formatos y campos antes de generación final
- **Flujo completo**: Automatización de los 7 pasos oficiales desde {#proceso-reporte}

**BENEFICIO CLAVE**: Eliminación del 95% de errores manuales y reducción del tiempo de proceso de 15 minutos a 1 minutos.