/**
 * Constantes de porcentajes del sistema TRABIX
 * Según secciones 2, 6, 16 del documento de especificación
 * 
 * NOTA: Estos son valores por defecto. Los valores reales
 * se leen desde la tabla ConfiguracionSistema en la base de datos.
 */

// Porcentajes de inversión (sección 2.2)
export const PORCENTAJES_INVERSION = {
  /** Porcentaje que paga el vendedor */
  VENDEDOR: 50,
  
  /** Porcentaje que paga el admin */
  ADMIN: 50,
} as const;

// Porcentajes de ganancia - Modelo 60/40 (sección 2.4)
export const PORCENTAJES_GANANCIA_60_40 = {
  /** Porcentaje de ganancia para vendedor */
  VENDEDOR: 60,
  
  /** Porcentaje de ganancia para admin */
  ADMIN: 40,
} as const;

// Porcentajes de ganancia - Modelo 50/50 (sección 2.4)
export const PORCENTAJES_GANANCIA_50_50 = {
  /** Porcentaje de ganancia para vendedor */
  VENDEDOR: 50,
  
  /** Porcentaje que se distribuye en cascada */
  CASCADA: 50,
} as const;

// Triggers de cuadre - Lote de 3 tandas (sección 16.6)
export const TRIGGERS_CUADRE_3_TANDAS = {
  /** Trigger para cuadre T2: stock llega a este % */
  TANDA_2: 10,
  
  /** Trigger para cuadre T3: stock llega a este % */
  TANDA_3: 20,
} as const;

// Triggers de cuadre - Lote de 2 tandas (sección 16.6)
export const TRIGGERS_CUADRE_2_TANDAS = {
  /** Trigger para cuadre T1: stock llega a este % */
  TANDA_1: 10,
  
  /** Trigger para cuadre T2: stock llega a este % */
  TANDA_2: 20,
} as const;

// Límites
export const LIMITES = {
  /** Máximo porcentaje de regalos permitidos por lote (sección 6.3) */
  REGALOS: 8,
  
  /** Porcentaje de stock bajo para notificación (sección 15) */
  NOTIFICACION_STOCK_BAJO: 25,
} as const;

// División de tandas (sección 16.1)
export const DIVISION_TANDAS = {
  /** Límite de TRABIX para 2 tandas (<=50 = 2 tandas, >50 = 3 tandas) */
  LIMITE_2_TANDAS: 50,
  
  /** Porcentaje por tanda en lote de 2 tandas */
  PORCENTAJE_2_TANDAS: 50,
  
  /** Porcentaje por tanda en lote de 3 tandas */
  PORCENTAJE_3_TANDAS: 33.33,
} as const;

// Tiempos
export const TIEMPOS = {
  /** Horas para auto-transición de LIBERADA a EN_TRÁNSITO (sección 4.3) */
  AUTO_TRANSITO_HORAS: 2,
} as const;

export type PorcentajesInversionType = typeof PORCENTAJES_INVERSION;
export type PorcentajesGanancia6040Type = typeof PORCENTAJES_GANANCIA_60_40;
export type PorcentajesGanancia5050Type = typeof PORCENTAJES_GANANCIA_50_50;
export type TriggersCuadre3TandasType = typeof TRIGGERS_CUADRE_3_TANDAS;
export type TriggersCuadre2TandasType = typeof TRIGGERS_CUADRE_2_TANDAS;
export type LimitesType = typeof LIMITES;
export type DivisionTandasType = typeof DIVISION_TANDAS;
export type TiemposType = typeof TIEMPOS;
