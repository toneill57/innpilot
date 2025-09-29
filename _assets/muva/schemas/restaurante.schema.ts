import { BaseListing } from './base.schema.js';

// Schema específico para Restaurantes
export interface RestauranteListing extends BaseListing {
  categoria: 'Restaurante';

  // Información específica de restaurante
  /** Tipo de cocina o especialidad gastronómica */
  tipo_cocina?: string;

  /** Información sobre el menú disponible */
  menu_info?: string;

  /** Con qué frecuencia cambia el menú */
  periodicidad_menu?: string;

  /** Capacidad del restaurante */
  capacidad?: string;

  /** Opciones especiales de dieta */
  opciones_dieta?: string[];

  /** Ambiente del restaurante */
  ambiente?: string;

  /** Servicios adicionales del restaurante */
  servicios_restaurante?: string[];

  /** Nivel de precios */
  rango_precios?: 'económico' | 'medio' | 'alto' | 'premium';

  /** Mejor momento para visitar */
  mejor_momento?: string;

  /** Dress code requerido */
  dress_code?: string;

  /** Opciones de reserva */
  acepta_reservas?: boolean;

  /** Métodos de pago aceptados */
  metodos_pago?: string[];
}

// Validation helper
export function isRestauranteListing(obj: any): obj is RestauranteListing {
  return obj && obj.categoria === 'Restaurante';
}

// Utility types
export type TipoCocina = RestauranteListing['tipo_cocina'];
export type RangoPrecios = RestauranteListing['rango_precios'];