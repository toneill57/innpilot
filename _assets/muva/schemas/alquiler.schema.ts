import { BaseListing } from './base.schema.js';

// Schema específico para Alquileres
export interface AlquilerListing extends BaseListing {
  categoria: 'Alquiler';

  // Información específica de alquileres
  /** Tipo de item o servicio que se alquila */
  tipo_alquiler?: string;

  /** Modalidades de alquiler disponibles */
  modalidades_alquiler?: string[];

  /** Duración mínima del alquiler */
  duracion_minima?: string;

  /** Duración máxima del alquiler */
  duracion_maxima?: string;

  /** Precios por diferentes períodos */
  precios_por_periodo?: {
    por_hora?: string;
    por_dia?: string;
    por_semana?: string;
    por_mes?: string;
  };

  /** Depósito requerido */
  deposito_requerido?: string;

  /** Documentos requeridos para el alquiler */
  documentos_requeridos?: string[];

  /** Edad mínima para alquilar */
  edad_minima_alquiler?: number;

  /** Licencias requeridas */
  licencias_requeridas?: string[];

  /** Estado y condición del equipo/item */
  estado_equipo?: string;

  /** Mantenimiento incluido */
  mantenimiento_incluido?: boolean;

  /** Seguro incluido */
  seguro_incluido?: boolean;

  /** Entrega a domicilio disponible */
  entrega_domicilio?: boolean;

  /** Pickup disponible */
  pickup_disponible?: boolean;

  /** Instrucciones de uso incluidas */
  instrucciones_incluidas?: boolean;

  /** Soporte técnico disponible */
  soporte_tecnico?: boolean;

  /** Política de daños */
  politica_danos?: string;

  /** Política de cancelación */
  politica_cancelacion_alquiler?: string;

  /** Disponibilidad estacional */
  disponibilidad_estacional?: string[];

  /** Capacidad o especificaciones técnicas */
  especificaciones_tecnicas?: string[];

  /** Accesorios incluidos */
  accesorios_incluidos?: string[];

  /** Servicios adicionales disponibles */
  servicios_adicionales?: string[];
}

// Validation helper
export function isAlquilerListing(obj: any): obj is AlquilerListing {
  return obj && obj.categoria === 'Alquiler';
}

// Utility types
export type TipoAlquiler = AlquilerListing['tipo_alquiler'];
export type ModalidadAlquiler = AlquilerListing['modalidades_alquiler'];