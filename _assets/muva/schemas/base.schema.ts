// Base schema - Campos comunes a todos los tipos de listings

export interface BaseListing {
  /** Identificador único del listing */
  id: string;

  /** Categoría del negocio */
  categoria: 'Restaurante' | 'Actividad' | 'Spot' | 'Alquiler' | 'Nigth Life';

  /** Nombre del establecimiento */
  nombre: string;

  /** Descripción detallada del lugar/servicio */
  descripcion: string;

  /** Horarios de atención */
  horario?: string;

  /** Información de precios */
  precio?: string;

  /** Historia o background del lugar */
  historia?: string;

  /** Persona encargada o personaje relevante */
  personaje?: string;

  /** Datos adicionales de color/curiosidades */
  datos_color?: string;

  /** Recomendaciones específicas */
  recomendaciones?: string;

  // Información geográfica
  /** Zona principal donde se ubica */
  zona?: string;

  /** Subzona específica */
  subzona?: string;

  /** Proximidad al aeropuerto */
  proximidad_aeropuerto?: 'CLOSE' | 'MEDIUM' | 'FAR';

  /** Tipo de zona */
  zona_tipo?: string;

  /** Características de la zona */
  caracteristicas_zona?: string[];

  /** Actividades disponibles en la zona */
  actividades_disponibles?: string[];

  /** Landmarks cercanos */
  landmarks_cercanos?: string[];

  /** Tipos de negocio en la zona */
  tipos_negocio_zona?: string[];

  // Información de contacto y marketing
  /** Información de contacto */
  contacto?: string;

  /** Palabras clave para búsqueda */
  palabras_clave?: string[];

  /** Tags especiales (pet friendly, eco friendly, etc.) */
  tags?: string[];

  /** Segmentación de mercado objetivo */
  segmentacion?: string[];

  /** Información sobre comisiones */
  comisiones?: string;

  // Metadatos de procesamiento
  /** Confianza en la detección de zona */
  _zona_detection_confidence?: 'high' | 'medium' | 'low';

  /** Número de columna original en el CSV */
  _original_column?: number;
}

// Utility types
export type ListingCategory = BaseListing['categoria'];
export type ProximityLevel = BaseListing['proximidad_aeropuerto'];
export type ZoneConfidence = BaseListing['_zona_detection_confidence'];

// Validation helpers
export function isValidCategory(categoria: string): categoria is ListingCategory {
  return ['Restaurante', 'Actividad', 'Spot', 'Alquiler', 'Nigth Life'].includes(categoria);
}

export function isBaseListing(obj: any): obj is BaseListing {
  return obj &&
         typeof obj.id === 'string' &&
         typeof obj.nombre === 'string' &&
         typeof obj.descripcion === 'string' &&
         isValidCategory(obj.categoria);
}