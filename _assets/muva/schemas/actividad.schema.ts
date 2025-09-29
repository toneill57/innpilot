import { BaseListing } from './base.schema.js';

// Schema específico para Actividades
export interface ActividadListing extends BaseListing {
  categoria: 'Actividad';

  // Información específica de actividades
  /** Tipo de actividad */
  tipo_actividad?: string;

  /** Duración típica de la actividad */
  duracion?: string;

  /** Nivel de dificultad requerido */
  nivel_dificultad?: 'principiante' | 'intermedio' | 'avanzado' | 'todos';

  /** Edad mínima requerida */
  edad_minima?: number;

  /** Edad máxima permitida */
  edad_maxima?: number;

  /** Requisitos físicos o de salud */
  requisitos_fisicos?: string[];

  /** Equipo incluido en la actividad */
  equipo_incluido?: string[];

  /** Equipo que debe traer el cliente */
  equipo_requerido?: string[];

  /** Certificaciones que se pueden obtener */
  certificaciones_disponibles?: string[];

  /** Temporadas ideales para la actividad */
  temporadas_ideales?: string[];

  /** Condiciones meteorológicas necesarias */
  condiciones_meteorologicas?: string[];

  /** Puntos de encuentro */
  puntos_encuentro?: string[];

  /** Política de cancelación */
  politica_cancelacion?: string;

  /** Número máximo de participantes */
  max_participantes?: number;

  /** Número mínimo de participantes */
  min_participantes?: number;

  /** Incluye transporte */
  incluye_transporte?: boolean;

  /** Incluye alimentación */
  incluye_alimentacion?: boolean;

  /** Instructor certificado incluido */
  instructor_certificado?: boolean;
}

// Validation helper
export function isActividadListing(obj: any): obj is ActividadListing {
  return obj && obj.categoria === 'Actividad';
}

// Utility types
export type TipoActividad = ActividadListing['tipo_actividad'];
export type NivelDificultad = ActividadListing['nivel_dificultad'];