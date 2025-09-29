// Schema exports
export * from './base.schema.js';
export * from './restaurante.schema.js';
export * from './actividad.schema.js';
export * from './spot.schema.js';
export * from './alquiler.schema.js';
export * from './nightlife.schema.js';

// Import specific types for union
import { BaseListing } from './base.schema.js';
import { RestauranteListing } from './restaurante.schema.js';
import { ActividadListing } from './actividad.schema.js';
import { SpotListing } from './spot.schema.js';
import { AlquilerListing } from './alquiler.schema.js';
import { NightLifeListing } from './nightlife.schema.js';

// Union type for all listing types
export type MuvaListing =
  | RestauranteListing
  | ActividadListing
  | SpotListing
  | AlquilerListing
  | NightLifeListing;

// Category mapping type
export type CategorySchema = {
  'Restaurante': RestauranteListing;
  'Actividad': ActividadListing;
  'Spot': SpotListing;
  'Alquiler': AlquilerListing;
  'Nigth Life': NightLifeListing;
};

// Type guard functions
export function isMuvaListing(obj: any): obj is MuvaListing {
  return obj && typeof obj.id === 'string' && typeof obj.categoria === 'string' &&
         ['Restaurante', 'Actividad', 'Spot', 'Alquiler', 'Nigth Life'].includes(obj.categoria);
}

// Schema factory function
export function getSchemaForCategory<T extends keyof CategorySchema>(categoria: T): CategorySchema[T] | null {
  // This is a type helper function - actual validation would be done by specific validators
  return null;
}

// Field relevance mapping - defines which fields are relevant for each category
export const FIELD_RELEVANCE: Record<keyof CategorySchema, string[]> = {
  'Restaurante': [
    'tipo_cocina', 'menu_info', 'periodicidad_menu', 'capacidad', 'opciones_dieta',
    'ambiente', 'servicios_restaurante', 'rango_precios', 'mejor_momento',
    'dress_code', 'acepta_reservas', 'metodos_pago'
  ],
  'Actividad': [
    'tipo_actividad', 'duracion', 'nivel_dificultad', 'edad_minima', 'edad_maxima',
    'requisitos_fisicos', 'equipo_incluido', 'equipo_requerido', 'certificaciones_disponibles',
    'temporadas_ideales', 'condiciones_meteorologicas', 'puntos_encuentro',
    'politica_cancelacion', 'max_participantes', 'min_participantes',
    'incluye_transporte', 'incluye_alimentacion', 'instructor_certificado'
  ],
  'Spot': [
    'tipo_spot', 'mejor_momento_dia', 'actividades_principales', 'facilidades',
    'costo_entrada', 'tiempo_visita_recomendado', 'accesibilidad', 'tipo_terreno',
    'vistas_disponibles', 'mejor_epoca_ano', 'nivel_concurrencia', 'servicios_cercanos',
    'fotografia_permitida', 'ideal_grupos', 'ideal_familias', 'ideal_parejas',
    'spot_romantico', 'eventos_especiales', 'wifi_disponible', 'estacionamiento'
  ],
  'Alquiler': [
    'tipo_alquiler', 'modalidades_alquiler', 'duracion_minima', 'duracion_maxima',
    'precios_por_periodo', 'deposito_requerido', 'documentos_requeridos', 'edad_minima_alquiler',
    'licencias_requeridas', 'estado_equipo', 'mantenimiento_incluido', 'seguro_incluido',
    'entrega_domicilio', 'pickup_disponible', 'instrucciones_incluidas', 'soporte_tecnico',
    'politica_danos', 'politica_cancelacion_alquiler', 'disponibilidad_estacional',
    'especificaciones_tecnicas', 'accesorios_incluidos', 'servicios_adicionales'
  ],
  'Nigth Life': [
    'tipo_nightlife', 'horarios_nocturnos', 'dias_pico', 'genero_musical', 'eventos_regulares',
    'dj_residente', 'musica_vivo', 'pista_baile', 'area_vip', 'cover_charge',
    'bebidas_especiales', 'happy_hour', 'promociones', 'edad_minima_entrada',
    'dress_code_nocturno', 'capacidad_personas', 'reservas_mesa', 'servicio_botella',
    'karaoke', 'juegos_disponibles', 'area_exterior', 'ambiente_principal',
    'publico_objetivo', 'politica_seguridad'
  ]
};