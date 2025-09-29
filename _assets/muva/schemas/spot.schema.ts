import { BaseListing } from './base.schema.js';

// Schema específico para Spots (Lugares de Interés)
export interface SpotListing extends BaseListing {
  categoria: 'Spot';

  // Información específica de spots
  /** Tipo de lugar o atracción */
  tipo_spot?: string;

  /** Mejor momento del día para visitar */
  mejor_momento_dia?: string[];

  /** Actividades principales que se pueden hacer */
  actividades_principales?: string[];

  /** Facilidades disponibles en el lugar */
  facilidades?: string[];

  /** Costo de entrada o acceso */
  costo_entrada?: string;

  /** Tiempo recomendado de visita */
  tiempo_visita_recomendado?: string;

  /** Accesibilidad del lugar */
  accesibilidad?: string[];

  /** Tipo de terreno o superficie */
  tipo_terreno?: string;

  /** Vistas disponibles desde el lugar */
  vistas_disponibles?: string[];

  /** Mejor época del año para visitar */
  mejor_epoca_ano?: string[];

  /** Nivel de concurrencia turística */
  nivel_concurrencia?: 'bajo' | 'medio' | 'alto' | 'muy_alto';

  /** Servicios cercanos al spot */
  servicios_cercanos?: string[];

  /** Fotografía permitida */
  fotografia_permitida?: boolean;

  /** Ideal para grupos */
  ideal_grupos?: boolean;

  /** Ideal para familias */
  ideal_familias?: boolean;

  /** Ideal para parejas */
  ideal_parejas?: boolean;

  /** Spot romántico */
  spot_romantico?: boolean;

  /** Lugar para eventos especiales */
  eventos_especiales?: boolean;

  /** Conexión Wi-Fi disponible */
  wifi_disponible?: boolean;

  /** Estacionamiento disponible */
  estacionamiento?: boolean;
}

// Validation helper
export function isSpotListing(obj: any): obj is SpotListing {
  return obj && obj.categoria === 'Spot';
}

// Utility types
export type TipoSpot = SpotListing['tipo_spot'];
export type NivelConcurrencia = SpotListing['nivel_concurrencia'];