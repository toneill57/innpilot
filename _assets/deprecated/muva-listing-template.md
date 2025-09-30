---
# 🎯 PLANTILLA OFICIAL MUVA LISTING
# Esta plantilla define la estructura estándar para listings de turismo en San Andrés

version: "1.0"
type: tourism  # Opciones: tourism, accommodation, content

# ⚠️ DESTINO EN BASE DE DATOS (NO MODIFICAR)
destination:
  schema: public
  table: muva_content

# 📄 METADATOS DEL DOCUMENTO
document:
  title: "NOMBRE DEL NEGOCIO EN MAYÚSCULAS"  # ✅ REQUERIDO
  description: "Descripción corta y concisa del negocio (1-2 líneas)"  # ✅ REQUERIDO
  category: activities  # ✅ REQUERIDO: activities, restaurantes, hospedajes, transporte
  subcategory: deportes_acuaticos  # ✅ REQUERIDO: deportes_acuaticos, gastronomia_local, etc.
  language: es
  version: "1.0"
  status: active
  tags: [tag1, tag2, tag3]  # Tags generales para búsqueda
  keywords: [keyword1, keyword2, keyword3]  # Keywords específicos

# 🏢 INFORMACIÓN DEL NEGOCIO (CRÍTICO PARA UX)
business:
  id: nombre-del-negocio-en-minusculas  # ✅ REQUERIDO: slug único
  nombre: NOMBRE DEL NEGOCIO  # ✅ REQUERIDO: nombre oficial
  categoria: Actividad  # ✅ REQUERIDO: Actividad, Restaurante, Hospedaje, Transporte

  # 💰 Información operativa
  horario: "Lunes a Viernes 9:00 - 18:00"  # ⚠️ IMPORTANTE para reservas
  precio: "Desde $50,000 COP por persona"  # ⚠️ CRÍTICO para decisiones

  # 📞 Información de contacto
  contacto: "@instagramhandle"  # ⚠️ IMPORTANTE: usuario de Instagram/redes
  telefono: "+573001234567"  # ⚠️ CRÍTICO para conversiones
  website: "https://ejemplo.com"  # Opcional pero recomendado

  # 📍 Ubicación
  zona: "Centro"  # ✅ REQUERIDO: Centro, San Luis, La Loma, etc.
  subzona: "Spratt Bight"  # Opcional: área específica dentro de la zona

  # 🎯 Segmentación de público
  segmentacion: ["Low cost", "mochilero", "aventurero", "eco friendly", "soltero", "negocios", "lujo"]

  # 🎪 Actividades y características
  actividades_disponibles: ["actividad1", "actividad2"]  # Para actividades deportivas
  caracteristicas_zona: ["Característica 1", "Característica 2"]
  landmarks_cercanos: ["Landmark 1", "Landmark 2"]
---

# NOMBRE DEL NEGOCIO

## Descripción General

[Descripción detallada del negocio, su propuesta de valor única, y por qué los visitantes deberían elegirlo. Incluir historia si es relevante.]

## Servicios Ofrecidos

### 🎯 Servicio Principal
- **Descripción**: [Detalles del servicio]
- **Duración**: [Tiempo estimado]
- **Precio**: $XX,XXX COP
- **Nivel**: [Principiantes/Intermedios/Avanzados]

### ⚡ Servicio Secundario
- **Descripción**: [Detalles del servicio]
- **Duración**: [Tiempo estimado]
- **Precio**: $XX,XXX COP

## Información de Contacto

- **Teléfono**: [Número con código de país]
- **Instagram**: [Handle sin @]
- **Website**: [URL completa]
- **Modalidad**: [Atención bajo cita previa / Walk-in / Ambos]

## Ubicación y Zona

### Características de la Zona ([Nombre de la Zona])
- [Característica 1]
- [Característica 2]
- [Característica 3]

### Landmarks Cercanos
- [Landmark 1]
- [Landmark 2]

## Público Objetivo

El negocio atiende a:
- **[Segmento 1]**: [Descripción de por qué es ideal para este segmento]
- **[Segmento 2]**: [Descripción de por qué es ideal para este segmento]
- **[Segmento 3]**: [Descripción de por qué es ideal para este segmento]

## Ventajas Competitivas

1. **[Ventaja 1]**: [Descripción]
2. **[Ventaja 2]**: [Descripción]
3. **[Ventaja 3]**: [Descripción]

## Recomendaciones para Visitantes

- **Mejor época**: [Temporada recomendada]
- **Reserva**: [Indispensable / Recomendada / No necesaria]
- **Nivel requerido**: [Ninguno / Básico / Avanzado]
- **Qué traer**: [Lista de elementos necesarios]
- **Duración típica**: [Tiempo estimado de la experiencia]

---

## 📋 NOTAS PARA DESARROLLADORES

### Campos Críticos para Premium Chat:
1. **business.nombre**: Se muestra como título principal
2. **business.precio**: Aparece con emoji 💰 en respuesta
3. **business.telefono**: Aparece con emoji 📞 (crítico para conversión)
4. **business.zona**: Aparece con emoji 📍 (importante para localización)
5. **business.website**: Aparece con emoji 🌐 (solo si existe)

### Validación Automática:
- El script `populate-embeddings.js` validará que campos requeridos existan
- Si falta información crítica, el script mostrará warnings
- Todos los campos `business.*` se guardan en `business_info` JSONB

### Procesamiento:
```bash
# Generar embeddings
node scripts/populate-embeddings.js _assets/muva/listings-enriched/tu-archivo.md

# El sistema automáticamente:
# 1. Extrae metadata del frontmatter YAML
# 2. Genera embeddings multi-tier (1024d + 3072d)
# 3. Guarda en public.muva_content con business_info completo
# 4. Indexa para búsqueda ultra-rápida (<15ms)
```

### Ejemplo de Respuesta en Premium Chat:
```
En San Andrés puedes ir a NOMBRE DEL NEGOCIO:

📍 Zona: Centro - Spratt Bight
💰 Precio: Desde $50,000 COP por persona
📞 Contacto: +573001234567
🌐 Web: ejemplo.com

[Descripción del negocio...]
```