/**
 * Constantes de precios del sistema TRABIX
 * Según sección 0.3 del documento de especificación
 * 
 * NOTA: Estos son valores por defecto. Los valores reales
 * se leen desde la tabla ConfiguracionSistema en la base de datos.
 */

// Precios al detal
export const PRECIOS = {
  /** Precio de 1 TRABIX con licor */
  UNIDAD_LICOR: 8000,
  
  /** Precio de promoción (2 TRABIX con licor) */
  PROMO_LICOR: 12000,
  
  /** Precio de 1 TRABIX sin licor */
  UNIDAD_SIN_LICOR: 7000,
  
  /** Costo percibido por TRABIX (para vendedores) */
  COSTO_PERCIBIDO: 2400,
  
  /** Aporte al fondo de recompensas por TRABIX */
  APORTE_FONDO: 200,
} as const;

// Precios al mayor - CON LICOR
export const PRECIOS_MAYOR_LICOR = {
  /** >20 unidades */
  MAYOR_20: 4900,
  
  /** >50 unidades */
  MAYOR_50: 4700,
  
  /** >100 unidades */
  MAYOR_100: 4500,
} as const;

// Precios al mayor - SIN LICOR
export const PRECIOS_MAYOR_SIN_LICOR = {
  /** >20 unidades */
  MAYOR_20: 4800,
  
  /** >50 unidades */
  MAYOR_50: 4500,
  
  /** >100 unidades */
  MAYOR_100: 4200,
} as const;

// Equipamiento
export const PRECIOS_EQUIPAMIENTO = {
  /** Mensualidad con depósito */
  MENSUALIDAD_CON_DEPOSITO: 9990,
  
  /** Mensualidad sin depósito */
  MENSUALIDAD_SIN_DEPOSITO: 19990,
  
  /** Depósito inicial */
  DEPOSITO: 49990,
  
  /** Costo por daño de nevera */
  DANO_NEVERA: 30000,
  
  /** Costo por daño de pijama */
  DANO_PIJAMA: 60000,
} as const;

// Cantidades mínimas
export const CANTIDADES = {
  /** Mínimo de unidades para venta al mayor */
  MINIMO_VENTA_MAYOR: 20,
} as const;

export type PreciosType = typeof PRECIOS;
export type PreciosMayorLicorType = typeof PRECIOS_MAYOR_LICOR;
export type PreciosMayorSinLicorType = typeof PRECIOS_MAYOR_SIN_LICOR;
export type PreciosEquipamientoType = typeof PRECIOS_EQUIPAMIENTO;
