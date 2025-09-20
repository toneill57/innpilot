---
# Identificación principal
name: "[BUSINESS_NAME]"
description: "[Brief description of business/activity and main attractions]"
document_type: muva # Fixed for MUVA tourism domain
business_type: "[CATEGORY]" # OPTIONS: Actividad|Restaurante|Spot|Night Life|Alquiler

# Geolocalización enriquecida
location:
  zone: "[ZONE]" # OPTIONS: Centro|Loma|San Luis|Cove
  zone_description: "[AUTO-FILLED from zone-mapping.json]"
  subzone: "[SUBZONE]" # Validated against zones mapping
  subzone_description: "[AUTO-FILLED from zone-mapping.json]"
  noise_level: "[AUTO-FILLED]" # muy_tranquilo|tranquilo|moderado|ruidoso|muy_ruidoso|variable
  security_level: "[AUTO-FILLED]" # muy_seguro|seguro|moderado|inseguro
  proximity_to_airport: "[AUTO-FILLED]" # CLOSE|MEDIUM|FAR
  raizal_name: "[IF_APPLICABLE]" # Traditional Raizal name

# Características de la zona (auto-generadas desde zone-mapping.json)
zone_features:
  - "[AUTO-FILLED_FEATURE_1]" # From zone characteristics
  - "[AUTO-FILLED_FEATURE_2]" # From subzone landmarks
  - "[AUTO-FILLED_FEATURE_3]" # From coastal features if applicable

# Información contextual automática
context:
  ideal_for: ["[AUTO-FILLED]"] # Based on subzone activities
  landmarks: ["[AUTO-FILLED]"] # From subzone data
  warnings: ["[AUTO-FILLED]"] # Security or safety warnings if any
  recommendations: ["[AUTO-FILLED]"] # Practical recommendations
  noise_notes: "[AUTO-FILLED]" # Detailed noise level information
  coastal_features: "[AUTO-FILLED]" # Beach/rocky coast information

# Segmentación y audiencia objetivo (auto-enriquecida desde market-segments.json)
target_audience:
  - "[SEGMENT_1]" # OPTIONS: low_cost|mochilero|aventurero|eco_friendly|soltero|negocios|lujo
  - "[SEGMENT_2]" # Multiple segments allowed

# Perfiles de audiencia (auto-completados desde market-segments.json)
audience_profiles:
  segment_descriptions: ["[AUTO-FILLED]"] # Detailed descriptions from market-segments.json
  budget_ranges: ["[AUTO-FILLED]"] # Budget ranges for each target segment
  interests_alignment: ["[AUTO-FILLED]"] # How business aligns with segment interests
  transport_preferences: ["[AUTO-FILLED]"] # Transport preferences of segments

# Información práctica de operación
business_hours:
  schedule: "[HOURS]" # Specific opening hours
  seasonal_variations: "[IF_APPLICABLE]" # High/low season changes
  days_closed: "[IF_APPLICABLE]" # Specific closure days

pricing:
  range: "[PRICE_RANGE]" # Specific price information from CSV
  currency: "COP" # Colombian Pesos
  payment_methods: ["cash", "card", "transfer"] # Accepted payment types
  commission_info: "[IF_APPLICABLE]" # For tour operators

contact:
  whatsapp: "[WHATSAPP_NUMBER]"
  email: "[EMAIL_ADDRESS]"
  instagram: "[INSTAGRAM_HANDLE]"
  website: "[WEBSITE_URL]"
  physical_address: "[IF_AVAILABLE]"

# Características y servicios especiales
amenities:
  pet_friendly: false # From CSV tags
  "420_friendly": false # Cannabis-friendly establishments
  vegetarian_options: false # Food establishments
  wheelchair_accessible: false # Accessibility information
  wifi_available: false # Internet connectivity
  parking_available: false # Parking facilities
  english_speaking_staff: false # Language support
  accepts_reservations: false # Booking requirements

# Tags y optimización de búsqueda
tags: [tag1, tag2, tag3] # From CSV tags field
keywords: [keyword1, keyword2, keyword3] # From CSV keywords field
search_terms: "[ZONE] [SUBZONE] [BUSINESS_TYPE]" # Auto-generated for SEO

# Control de versiones y metadatos
metadata:
  status: active # OPTIONS: active|draft|archived|seasonal
  version: "1.0"
  menu_info: "[IF_RESTAURANT]" # Menu update frequency
  last_menu_update: null # For restaurants with menus
  historical_significance: "[IF_APPLICABLE]" # Cultural/historical importance
  updated_at: "2025-09-19T00:00:00Z" # ISO format with timezone
  created_at: "2025-09-19T00:00:00Z" # ISO format with timezone

# NOTES FOR DEVELOPERS:
# - zone_description: Auto-filled from zonas_y_subzonas.csv
# - zone_features: Generated based on zone characteristics
# - search_terms: Automatically concatenated for search optimization
# - amenities: Boolean fields for filtering and search
# - Use exact zone/subzone names from validation mapping
---

# [BUSINESS_NAME]

## ¿Qué es [BUSINESS_NAME] y por qué visitarlo? {#overview}

**Q: ¿Qué hace especial a [BUSINESS_NAME] en San Andrés?**
**A:** [Descripción completa del negocio, actividad o lugar, incluyendo qué lo diferencia de otros establecimientos similares y por qué vale la pena visitarlo durante tu estadía en San Andrés.]

## Ubicación y Acceso {#location}

**Q: ¿Dónde está ubicado [BUSINESS_NAME] y cómo llegar?**
**A:** Ubicado en [SUBZONE], zona [ZONE] de San Andrés.

**Sobre la zona [ZONE]:** [AUTO-FILLED ZONE_DESCRIPTION]

**Sobre [SUBZONE]:** [AUTO-FILLED SUBZONE_DESCRIPTION]

### Información del Área:
- **Nivel de ruido:** [AUTO-FILLED NOISE_LEVEL] - [AUTO-FILLED NOISE_NOTES]
- **Seguridad:** [AUTO-FILLED SECURITY_LEVEL]
- **Distancia al aeropuerto:** [AUTO-FILLED PROXIMITY_TO_AIRPORT]
- **Características costeras:** [AUTO-FILLED COASTAL_FEATURES]

### Cómo llegar:
- **Desde el aeropuerto:** [SPECIFIC_DIRECTIONS based on proximity]
- **Desde el centro:** [SPECIFIC_DIRECTIONS]
- **Transporte recomendado:** [AUTO-FILLED based on zone transport]
- **Puntos de referencia:** [AUTO-FILLED LANDMARKS]
- **Tiempo estimado:** [TRAVEL_TIME] desde las zonas principales

### Advertencias y Recomendaciones:
[AUTO-FILLED WARNINGS and RECOMMENDATIONS from zone data]

## Información Práctica {#practical-info}

**Q: ¿Cuáles son los horarios, precios y datos prácticos?**
**A:** Información esencial para planear tu visita:

### Horarios y Disponibilidad
- **Horario regular:** [SCHEDULE]
- **Variaciones estacionales:** [IF_APPLICABLE]
- **Días de cierre:** [IF_APPLICABLE]
- **Mejor momento para visitar:** [RECOMMENDATIONS]

### Precios y Pagos
- **Rango de precios:** [PRICE_RANGE]
- **Formas de pago aceptadas:** [PAYMENT_METHODS]
- **Política de reservas:** [IF_APPLICABLE]
- **Información de comisiones:** [IF_APPLICABLE]

### Servicios y Facilidades
- **Idiomas atendidos:** [LANGUAGES]
- **Accesibilidad:** [ACCESSIBILITY_INFO]
- **Servicios especiales:** [SPECIAL_SERVICES]

## Historia y Contexto Cultural {#history}

**Q: ¿Cuál es la historia de [BUSINESS_NAME]?**
**A:** [Información histórica del establecimiento, incluyendo cuando fue fundado, por quién, y cómo ha evolucionado. Incluir conexión con la cultura isleña si aplica.]

### Personaje Clave
[Información sobre el dueño, fundador o persona emblemática asociada al lugar]

## Recomendaciones de Expertos Locales {#recommendations}

**Q: ¿Qué recomiendan quienes conocen bien el lugar?**
**A:** Consejos esenciales de locales y visitantes frecuentes:

- **Platos/servicios imperdibles:** [SPECIFIC_RECOMMENDATIONS]
- **Mejores horarios para visitar:** [TIMING_TIPS]
- **Qué traer/llevar:** [PRACTICAL_ITEMS]
- **Combinaciones recomendadas:** [OTHER_ACTIVITIES_NEARBY]
- **Consejos para primera visita:** [FIRST_TIME_TIPS]

## Perfiles de Audiencia {#audience-profiles}

**Q: ¿Para qué tipo de viajeros es ideal [BUSINESS_NAME]?**
**A:** Este establecimiento está diseñado para [AUTO-FILLED TARGET SEGMENTS].

### Segmentos Principales:
[AUTO-FILLED SEGMENT DESCRIPTIONS - detailed descriptions for each target segment]

### Alineación con Intereses:
[AUTO-FILLED INTERESTS ALIGNMENT - how the business matches segment preferences]

### Presupuestos Recomendados:
[AUTO-FILLED BUDGET RANGES - budget information for each segment]

### Transporte Preferido:
[AUTO-FILLED TRANSPORT PREFERENCES - recommended transport for target segments]

## Experiencia y Ambiente {#experience}

**Q: ¿Qué puedes esperar de la experiencia en [BUSINESS_NAME]?**
**A:** [Descripción detallada del ambiente, tipo de experiencia, qué hace único el lugar, datos curiosos o características especiales que lo distinguen.]

### Datos Adicionales
- **Capacidad aproximada:** [IF_APPLICABLE]
- **Tipo de ambiente:** [ATMOSPHERE_DESCRIPTION]
- **Características únicas:** [SPECIAL_FEATURES]
- **Conexión con la cultura local:** [CULTURAL_SIGNIFICANCE]
- **Ideal para:** [AUTO-FILLED IDEAL_FOR activities]

## Información de Contacto {#contact}

**Q: ¿Cómo contactar y reservar en [BUSINESS_NAME]?**
**A:** Datos de contacto actualizados:

- **WhatsApp:** [WHATSAPP_NUMBER]
- **Instagram:** [INSTAGRAM_HANDLE]
- **Correo electrónico:** [EMAIL_ADDRESS]
- **Sitio web:** [WEBSITE_URL]
- **Dirección física:** [PHYSICAL_ADDRESS]

### Política de Reservas
[Información específica sobre cómo y cuándo reservar, si es necesario]

---

## Template Usage Guide for MUVA Domain

### Target Ratio: 80% Content / 20% Metadata

**✅ Use Cross-References When:**
- Connecting related businesses in same zone: `{#location}`
- Referencing practical information: `{#practical-info}`
- Linking to cultural context: `{#history}`
- Maximum 2-3 references per section for optimal embedding

**❌ Avoid:**
- Excessive zone descriptions (use auto-fill)
- Duplicate contact information
- Generic recommendations without local insight
- More than 12 YAML metadata fields

**MUVA-Specific Guidelines:**
- Each zone gets contextual information from zones CSV
- Include cultural significance when applicable
- Focus on tourist practical needs (transport, payment, timing)
- Emphasize local recommendations and insider tips
- Use Q&A format optimized for "how to get to..." and "what to expect..." queries

**Geographic Consistency:**
- Validate zone/subzone against official mapping
- Include transport and accessibility information
- Reference nearby attractions for trip planning
- Maintain island-specific cultural context