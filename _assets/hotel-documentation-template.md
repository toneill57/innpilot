---
type: "hotel_process"
business_name: "[BUSINESS_NAME]"
business_nit: "[NIT_NUMBER]"
location: "[CITY, COUNTRY]"
tenant_id: "[TENANT_UUID]"
destination:
  schema: "hotels"
  table: "accommodation_units"
document:
  title: "[DOCUMENT_TITLE]"
  description: "[Brief description of accommodation unit]"
  category: "accommodations"
  subcategory: "accommodation_unit"
  language: "es"
  tags: ["[specific_unit]", "[feature]", "[location]"]
  keywords: ["[search_term_1]", "[search_term_2]", "[unit_specific]"]
accommodation:
  unit_type: "[apartment|room]"
  capacity: [NUMBER]
  motopress_type_id: [NUMBER]
  motopress_instance_id: [NUMBER]
  bed_configuration: "[BED_TYPE]"
  size_m2: [NUMBER]
  floor_number: [NUMBER]
  view_type: "[VIEW_DESCRIPTION]"
  adults: [NUMBER]
  children: [NUMBER]
  base_adults: [NUMBER]
  base_children: [NUMBER]
  images: []
  amenities:
    features: ["[amenity_1]", "[amenity_2]", "[amenity_3]"]
    attributes:
      unit_type_detail: "[detailed_unit_type]"
      category: "[unit_category]"
      special_features: ["[special_feature_1]"]
  # NUEVOS - Pricing (Motopress integration)
  pricing:
    base_price_low_season: [NUMBER]
    base_price_high_season: [NUMBER]
    price_per_person_low: [NUMBER]
    price_per_person_high: [NUMBER]
    currency: "COP"
    minimum_stay: [NUMBER]
  # NUEVOS - Booking (Motopress integration)
  booking:
    check_in_time: "15:00:00"
    check_out_time: "12:00:00"
    day_restrictions: []
  # NUEVOS - Status (Motopress integration)
  status: "active"
  is_featured: false
  display_order: [NUMBER]
  # NUEVOS - Motopress Integration
  categories: []
version: "1.0"
---

# [DOCUMENT_TITLE]

## Overview {#overview}

**Q: ¿Qué es [MAIN_CONCEPT] y por qué es especial?**
**A:** [Comprehensive description of the accommodation unit, its unique features, and value proposition for guests.]

## Capacidad y Configuración {#capacity-distribution}

**Q: ¿Cuál es la capacidad y distribución de espacios?**
**A:** Detalles completos de capacidad y configuración:

### Capacidad y Distribución
- **Capacidad máxima**: [NUMBER] personas <!-- EXTRAE: capacity.max_capacity -->
- **Capacidad mínima**: [NUMBER] personas <!-- EXTRAE: capacity.min_capacity -->
- **Configuración de camas**: [DESCRIPTION] <!-- EXTRAE: bed_configuration -->
- **Tamaño**: [SIZE] metros cuadrados <!-- EXTRAE: size_m2 -->
- **Número de piso**: [FLOOR] <!-- EXTRAE: floor_number -->
- **Tipo de vista**: [VIEW_DESCRIPTION] <!-- EXTRAE: view_type -->
- **Número de unidad**: [UNIT_IDENTIFIER] <!-- EXTRAE: unit_number -->

### Espacios y Áreas
- **Habitaciones**: [ROOM_DETAILS]
- **Baños**: [BATHROOM_DETAILS]
- **Áreas comunes**: [COMMON_AREAS]
- **Características únicas**: [UNIQUE_FEATURES] <!-- EXTRAE: unique_features -->

## Precios por Temporada {#pricing-seasons}

**Q: ¿Cuáles son las tarifas según temporada y ocupación?**
**A:** Estructura completa de precios:

### Temporada Baja
- **[MIN_GUESTS] personas**: $[AMOUNT] COP por noche <!-- EXTRAE: base_price_low_season -->
- **Tarifa persona adicional**: $[AMOUNT] COP por noche <!-- EXTRAE: price_per_person_low -->

### Temporada Alta
- **[MIN_GUESTS] personas**: $[AMOUNT] COP por noche <!-- EXTRAE: base_price_high_season -->
- **Tarifa persona adicional**: $[AMOUNT] COP por noche <!-- EXTRAE: price_per_person_high -->

## Amenidades y Comodidades {#amenities-features}

**Q: ¿Qué amenidades incluye el alojamiento?**
**A:** Lista completa de amenidades y características:

### Tecnología y Conectividad
- **Smart TV** con cuenta de Netflix incluida
- **Wi-Fi de alta velocidad** <!-- EXTRAE: amenities_list -->
- **Internet** con cobertura completa

### Características Únicas y Especiales
- **[UNIQUE_FEATURE_1]**: [DESCRIPTION] <!-- EXTRAE: unique_features -->
- **[UNIQUE_FEATURE_2]**: [DESCRIPTION] <!-- EXTRAE: unique_features -->

### Características de Accesibilidad
- **Acceso**: [ACCESSIBILITY_DETAILS] <!-- EXTRAE: accessibility_features -->
- **Adaptaciones**: [ACCESSIBILITY_FEATURES] <!-- EXTRAE: accessibility_features -->

### Amenities en Texto Completo
[LIST_ALL_AMENITIES_COMMA_SEPARATED] <!-- EXTRAE: unit_amenities -->

## Información Visual y Ubicación {#visual-ubicacion}

**Q: ¿Qué información visual y de ubicación está disponible?**
**A:** Detalles completos de imágenes y ubicación:

### Galería Visual e Imágenes
- **Foto principal**: [IMAGE_DESCRIPTION] <!-- EXTRAE: images -->
- **URL de imagen**: [IMAGE_URL] <!-- EXTRAE: images -->

### Ubicación y Detalles del Espacio
- **Ubicación específica**: [SPECIFIC_LOCATION] <!-- EXTRAE: location_details -->
- **Contexto**: [CITY_CONTEXT] <!-- EXTRAE: location_details -->

### Atractivos y Características Turísticas
- **Experiencias cercanas**: [TOURISM_FEATURES] <!-- EXTRAE: tourism_features -->
- **Contexto turístico**: [TOURISM_CONTEXT] <!-- EXTRAE: tourism_features -->

## Políticas y Configuración {#politicas-configuracion}

**Q: ¿Cuáles son las políticas específicas y configuración del alojamiento?**
**A:** Información completa de políticas y estado:

### Políticas Específicas del Alojamiento
- **Capacidad**: [CAPACITY_POLICY] <!-- EXTRAE: booking_policies -->
- **Check-in/Check-out**: [CHECKIN_POLICY] <!-- EXTRAE: booking_policies -->
- **Política de ruido**: [NOISE_POLICY] <!-- EXTRAE: booking_policies -->
- **Política de fumar**: [SMOKING_POLICY] <!-- EXTRAE: booking_policies -->

### Estado y Configuración del Sistema
- **Estado operacional**: [STATUS] - [STATUS_DESCRIPTION] <!-- EXTRAE: status -->
- **Destacado**: [FEATURED_STATUS] - [FEATURED_DESCRIPTION] <!-- EXTRAE: is_featured -->
- **Orden de visualización**: [DISPLAY_ORDER] - [ORDER_DESCRIPTION] <!-- EXTRAE: display_order -->

## Proceso de Reserva {#booking-process}

**Q: ¿Cómo se realiza la reserva?**
**A:** Proceso paso a paso:

1. **Consulta disponibilidad**: Verificar fechas deseadas
2. **Seleccionar ocupación**: Confirmar número de huéspedes
3. **Confirmar temporada**: Validar tarifas aplicables
4. **Realizar reserva**: A través del sistema oficial
5. **Confirmación**: Recibir detalles de check-in