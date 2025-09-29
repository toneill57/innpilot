import { BaseListing } from './base.schema.js';

// Schema específico para Vida Nocturna (Night Life)
export interface NightLifeListing extends BaseListing {
  categoria: 'Nigth Life';

  // Información específica de vida nocturna
  /** Tipo de establecimiento nocturno */
  tipo_nightlife?: string;

  /** Horarios de apertura nocturna */
  horarios_nocturnos?: string;

  /** Días de mayor actividad */
  dias_pico?: string[];

  /** Género musical principal */
  genero_musical?: string[];

  /** Eventos especiales regulares */
  eventos_regulares?: string[];

  /** DJ residente */
  dj_residente?: string;

  /** Música en vivo */
  musica_vivo?: boolean;

  /** Pista de baile */
  pista_baile?: boolean;

  /** Área VIP disponible */
  area_vip?: boolean;

  /** Cover charge o entrada */
  cover_charge?: string;

  /** Lista de bebidas especiales */
  bebidas_especiales?: string[];

  /** Happy hour */
  happy_hour?: string;

  /** Promociones especiales */
  promociones?: string[];

  /** Edad mínima de entrada */
  edad_minima_entrada?: number;

  /** Dress code nocturno */
  dress_code_nocturno?: string;

  /** Capacidad del lugar */
  capacidad_personas?: number;

  /** Reservas de mesa */
  reservas_mesa?: boolean;

  /** Servicio de botella */
  servicio_botella?: boolean;

  /** Karaoke disponible */
  karaoke?: boolean;

  /** Juegos disponibles */
  juegos_disponibles?: string[];

  /** Terraza o área exterior */
  area_exterior?: boolean;

  /** Ambiente principal */
  ambiente_principal?: string;

  /** Público objetivo */
  publico_objetivo?: string[];

  /** Política de seguridad */
  politica_seguridad?: string;
}

// Validation helper
export function isNightLifeListing(obj: any): obj is NightLifeListing {
  return obj && obj.categoria === 'Nigth Life';
}

// Utility types
export type TipoNightLife = NightLifeListing['tipo_nightlife'];
export type GeneroMusical = NightLifeListing['genero_musical'];