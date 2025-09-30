---
# 🎯 PLANTILLA MUVA V2.0 - OPTIMIZADA PARA METADATA Y BÚSQUEDA
# Actualizada: Septiembre 2025
# Compatible con: Matryoshka Embeddings + Semantic Tags + 17 Subcategorías Específicas

version: "2.0"
type: tourism

# ⚠️ DESTINO EN BASE DE DATOS (NO MODIFICAR)
destination:
  schema: public
  table: muva_content

# 📄 METADATOS DEL DOCUMENTO
document:
  title: "NOMBRE DEL NEGOCIO EN MAYÚSCULAS"  # ✅ REQUERIDO
  description: "Descripción corta y concisa del negocio en 1-2 líneas"  # ✅ REQUERIDO

  # 🗂️ CATEGORÍA Y SUBCATEGORÍA
  category: activities  # ✅ REQUERIDO: activities | spots | restaurants | rentals | culture
  subcategory: diving   # ✅ REQUERIDO: Ver guía de subcategorías abajo ⬇️

  language: es
  version: "2.0"
  status: active

  # 🏷️ TAGS SEMÁNTICOS BILINGÜES (7-11 tags)
  # Propósito: Búsqueda y filtrado eficiente
  # Formato: lowercase, snake_case, Español + Inglés
  tags: [diving, scuba, padi, certification, dive_school, underwater, buceo, certificacion, centro_buceo, professional]

  # 🔑 KEYWORDS ESPECÍFICOS DEL NEGOCIO
  # Propósito: Identidad del negocio + metadata específica
  # Incluye: nombres propios, variantes, términos literales
  keywords: [nombre-negocio, nombre negocio, actividad, centro, zona, precio_especial]

# 🏢 INFORMACIÓN DEL NEGOCIO (CRÍTICO PARA UX)
business:
  id: nombre-del-negocio-slug  # ✅ REQUERIDO: slug único en minúsculas
  nombre: NOMBRE DEL NEGOCIO   # ✅ REQUERIDO: nombre oficial
  categoria: Actividad         # ✅ REQUERIDO: Actividad | Restaurante | Spot | Alquiler | Cultura

  # 💰 Información operativa
  horario: "Lunes a Viernes 9:00 - 18:00"  # ⚠️ IMPORTANTE para reservas
  precio: "Desde $50,000 COP por persona"  # ⚠️ CRÍTICO para decisiones

  # 📞 Información de contacto
  contacto: "@instagramhandle"      # ⚠️ IMPORTANTE: usuario de Instagram/redes
  telefono: "+573001234567"         # ⚠️ CRÍTICO para conversiones
  website: "https://ejemplo.com"    # Opcional pero recomendado

  # 📍 Ubicación
  zona: "Centro"          # ✅ REQUERIDO: Centro | San Luis | La Loma | Sound Bay | Cove
  subzona: "Spratt Bight" # Opcional: área específica dentro de la zona

  # 🎯 Segmentación de público (opcional)
  segmentacion: ["Low cost", "mochilero", "aventurero", "eco friendly", "familia", "lujo"]

  # 📍 Características de la zona (opcional)
  caracteristicas_zona: ["Zona comercial", "Alta concentración turística", "Playa cercana"]
  landmarks_cercanos: ["Playa Spratt Bight", "Centro comercial"]
---

# NOMBRE DEL NEGOCIO

## Descripción General

[Descripción detallada del negocio, su propuesta de valor única, y por qué los visitantes deberían elegirlo. 2-3 párrafos.]

## Servicios Ofrecidos

### 🎯 Servicio Principal
- **Descripción**: [Detalles del servicio]
- **Duración**: [Tiempo estimado]
- **Precio**: $XX,XXX COP
- **Nivel**: [Principiantes/Intermedios/Avanzados]

### ⚡ Servicio Secundario
- **Descripción**: [Detalles adicionales]
- **Duración**: [Tiempo estimado]
- **Precio**: $XX,XXX COP

## Información de Contacto

- **Teléfono**: +573001234567
- **Instagram**: @handle
- **Website**: https://ejemplo.com
- **Modalidad**: Atención bajo cita previa

## Ubicación y Zona

### Características de la Zona ([Nombre de la Zona])
- [Característica 1]
- [Característica 2]
- [Característica 3]

### Landmarks Cercanos
- [Landmark 1]
- [Landmark 2]

## Recomendaciones para Visitantes

- **Mejor época**: [Temporada recomendada]
- **Reserva**: [Indispensable / Recomendada / No necesaria]
- **Nivel requerido**: [Ninguno / Básico / Avanzado]
- **Qué traer**: [Lista de elementos necesarios]
- **Duración típica**: [Tiempo estimado total]

---

# 📖 GUÍA DE USO DE ESTA TEMPLATE

## 🗂️ SUBCATEGORÍAS ESPECÍFICAS POR CATEGORÍA

### **ACTIVITIES** (7 subcategorías)
- `diving` - Escuelas de buceo con certificaciones PADI
- `surf` - Escuelas de surf y clases para principiantes
- `wakeboard_kitesurf` - Deportes extremos acuáticos (wake, kite)
- `parasailing` - Vuelos en paracaídas sobre el mar
- `paddleboard` - Stand-up paddle board tranquilo
- `wellness` - Yoga, spa, meditación, bienestar
- `multi_activity` - Agencias que ofrecen múltiples actividades

### **SPOTS** (3 subcategorías)
- `beach_clubs` - Clubes de playa con comida/bebida/snorkeling
- `local_hangouts` - Lugares icónicos locales (ej: Bengue's)
- `nature_spots` - Jardines botánicos, lagunas, miradores naturales

### **RESTAURANTS** (4 subcategorías)
- `gastronomia_internacional` - Cocina internacional, fusion, sushi
- `gastronomia_saludable` - Smoothies, opciones sin gluten, healthy
- `gastronomia_local` - Comida típica isleña, autóctona
- `desserts` - Heladerías, postres, dulces

### **RENTALS** (1 subcategoría)
- `vehicle_rentals` - Alquiler de carros, motos, botes, pontones

### **CULTURE** (2 subcategorías)
- `museums` - Museos, sitios históricos
- `cultural_events` - Eventos musicales, shows en vivo, festivales

## 🏷️ ESTRATEGIA DE TAGS SEMÁNTICOS

### **Principios:**
1. **Bilingüe**: Siempre Español + Inglés
2. **Semántico**: Intención de búsqueda del usuario
3. **Normalizado**: lowercase, snake_case
4. **Cantidad**: 7-11 tags por documento
5. **Reutilizables**: Aplicables a múltiples negocios

### **Ejemplos por Categoría:**

**Diving:**
```yaml
tags: [diving, scuba, padi, certification, dive_school, underwater, buceo, certificacion, centro_buceo, professional]
```

**Surf:**
```yaml
tags: [surf, surfing, lessons, waves, beach, beginner_friendly, clases_surf, principiantes, water_sports, olas]
```

**Beach Clubs:**
```yaml
tags: [beach, beach_club, snorkeling, sunset, local_food, views, atardecer, caretear, playa, chill]
```

**Restaurants (Healthy):**
```yaml
tags: [restaurant, healthy, smoothies, breakfast, brunch, gluten_free, fruits, saludable, desayuno, sin_gluten]
```

**Rentals:**
```yaml
tags: [rentals, vehicles, cars, motorcycles, boats, alquiler, vehiculos, motos, carros, pontones]
```

## 🔑 TAGS vs KEYWORDS - ¿Cuál usar?

### **TAGS** (Semánticos, para filtrado)
- **Propósito**: Búsqueda y filtrado eficiente en memoria
- **Formato**: Normalizado (lowercase, snake_case)
- **Bilingüe**: Siempre Español + Inglés
- **Ejemplo**: `['diving', 'scuba', 'padi', 'buceo', 'certificacion']`
- **Uso en sistema**: Post-filtrado después de vector search

### **KEYWORDS** (Identidad, metadata)
- **Propósito**: Identidad del negocio + metadata específica
- **Formato**: Específico, variantes, términos literales
- **Ejemplo**: `['blue-life-dive', 'blue life dive', '$25', 'centro', 'actividad']`
- **Uso en sistema**: Incluidos en embeddings, matching exacto

**Regla de oro:**
- Tags para **BÚSQUEDA Y FILTRADO** (semantic, normalized)
- Keywords para **IDENTIDAD DEL NEGOCIO** (specific, literal)

---

# 📊 EJEMPLOS COMPLETOS POR CATEGORÍA

## Example 1: Diving School

```yaml
document:
  title: "BLUE LIFE DIVE"
  description: "Escuela de buceo profesional con certificaciones PADI y más de 25 años de experiencia"
  category: activities
  subcategory: diving
  tags: [diving, scuba, padi, certification, dive_school, underwater, buceo, certificacion, centro_buceo, professional]
  keywords: [blue-life-dive, blue life dive, centro, padi, $230000]
```

## Example 2: Beach Club

```yaml
document:
  title: "BIG MAMA"
  description: "Club de playa icónico en Cove con snorkeling, comida isleña y mejores atardeceres"
  category: spots
  subcategory: beach_clubs
  tags: [beach, beach_club, snorkeling, sunset, local_food, views, atardecer, caretear, playa, cove, chill]
  keywords: [big-mama, big mama, cove, hoyo soplador, km9]
```

## Example 3: Healthy Restaurant

```yaml
document:
  title: "BALI SMOOTHIES"
  description: "Restaurante saludable especializado en smoothies, bowls y opciones sin gluten"
  category: restaurants
  subcategory: gastronomia_saludable
  tags: [restaurant, healthy, smoothies, breakfast, brunch, gluten_free, fruits, saludable, desayuno, sin_gluten]
  keywords: [bali-smoothies, bali, desayuno, breakfast, bowl]
```

## Example 4: Vehicle Rental

```yaml
document:
  title: "DA BLACK ALMOND"
  description: "Alquiler de carros, motos y pontones con entrega en tu alojamiento"
  category: rentals
  subcategory: vehicle_rentals
  tags: [rentals, vehicles, cars, motorcycles, boats, alquiler, vehiculos, motos, carros, pontones]
  keywords: [da-black-almond, da black, alquiler, rental, moto, carro]
```

## Example 5: Cultural Event

```yaml
document:
  title: "CARIBBEAN NIGHTS"
  description: "Eventos musicales en vivo con artistas isleños en ambiente caribeño auténtico"
  category: culture
  subcategory: cultural_events
  tags: [culture, music, live_music, caribbean, artists, nightlife, cultura, musica_en_vivo, caribe, artistas, reggae]
  keywords: [caribbean-nights, job saas, eventos, musica, reggae]
```

---

# 🚀 PROCESAMIENTO Y GENERACIÓN DE EMBEDDINGS

## Comando para Procesar

```bash
node scripts/populate-embeddings.js _assets/muva/listings-by-category/tu-archivo.md
```

## El Sistema Automáticamente:

1. ✅ Extrae metadata del frontmatter YAML
2. ✅ Genera embeddings multi-tier (1024d + 3072d)
3. ✅ Guarda en `public.muva_content` con `business_info` completo
4. ✅ Indexa para búsqueda ultra-rápida (<15ms)
5. ✅ Aplica subcategory y tags optimizados

## Ejemplo de Respuesta en Premium Chat:

```
En San Andrés puedes bucear con BLUE LIFE DIVE:

📍 Zona: Centro
💰 Precio: Minicurso $230,000 COP
📞 Contacto: 317 434 4015
🌐 Web: bluelifedive.com

Escuela profesional con certificaciones PADI y más de 25 años de experiencia.
Ofrecen desde mini-cursos hasta certificaciones técnicas.
```

---

# ✅ CHECKLIST ANTES DE SUBIR

- [ ] `title` en MAYÚSCULAS
- [ ] `description` concisa (1-2 líneas)
- [ ] `category` correcta (activities/spots/restaurants/rentals/culture)
- [ ] `subcategory` ESPECÍFICA (no "general", usar las 17 subcategorías)
- [ ] `tags` bilingües y semánticos (7-11 tags)
- [ ] `keywords` con identidad del negocio
- [ ] `business.id` en slug format (minúsculas-con-guiones)
- [ ] `business.nombre` en MAYÚSCULAS
- [ ] `business.precio` con información clara
- [ ] `business.telefono` con código de país (+57)
- [ ] `business.zona` correcta
- [ ] Contenido descriptivo y útil (no solo metadata)

---

**Template Version:** 2.0
**Compatible con:** InnPilot Matryoshka Embeddings + Metadata Optimization
**Última actualización:** Septiembre 2025
**Documentación completa:** `docs/MUVA_TEMPLATE_GUIDE.md`