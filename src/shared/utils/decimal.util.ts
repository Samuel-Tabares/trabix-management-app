import Decimal from 'decimal.js';

/**
 * Configuración de Decimal.js para cálculos financieros
 * - Precisión de 12 dígitos (según Prisma schema)
 * - Redondeo HALF_UP (estándar financiero)
 */
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
});

/**
 * Crea un nuevo Decimal desde cualquier valor numérico
 */
export function toDecimal(value: number | string | Decimal): Decimal {
  return new Decimal(value);
}

/**
 * Suma múltiples valores decimales
 */
export function sumDecimals(...values: (number | string | Decimal)[]): Decimal {
  return values.reduce(
    (acc: Decimal, val) => acc.plus(toDecimal(val)),
    new Decimal(0),
  );
}

/**
 * Multiplica dos valores decimales
 */
export function multiplyDecimals(
  a: number | string | Decimal,
  b: number | string | Decimal,
): Decimal {
  return toDecimal(a).times(toDecimal(b));
}

/**
 * Divide dos valores decimales
 */
export function divideDecimals(
  a: number | string | Decimal,
  b: number | string | Decimal,
): Decimal {
  return toDecimal(a).dividedBy(toDecimal(b));
}

/**
 * Calcula el porcentaje de un valor
 * @param value - Valor base
 * @param percentage - Porcentaje (0-100)
 */
export function percentageOf(
  value: number | string | Decimal,
  percentage: number,
): Decimal {
  return toDecimal(value).times(percentage).dividedBy(100);
}

/**
 * Redondea un decimal a 2 lugares decimales (para pesos colombianos)
 */
export function roundToMoney(value: Decimal): Decimal {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/**
 * Redondea un decimal a entero (para cantidades de TRABIX)
 * Según documento: >= 0.5 redondea hacia arriba, < 0.5 redondea hacia abajo
 */
export function roundToInteger(value: Decimal): number {
  return value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Redondea hacia abajo (para cálculo de máximo de regalos)
 */
export function floorToInteger(value: Decimal): number {
  return value.floor().toNumber();
}

/**
 * Convierte Decimal a número (para respuestas JSON)
 */
export function decimalToNumber(value: Decimal): number {
  return value.toNumber();
}

/**
 * Convierte Decimal a string (para persistencia)
 */
export function decimalToString(value: Decimal): string {
  return value.toString();
}

/**
 * Verifica si un valor es mayor que otro
 */
export function isGreaterThan(
  a: number | string | Decimal,
  b: number | string | Decimal,
): boolean {
  return toDecimal(a).greaterThan(toDecimal(b));
}

/**
 * Verifica si un valor es mayor o igual que otro
 */
export function isGreaterThanOrEqual(
  a: number | string | Decimal,
  b: number | string | Decimal,
): boolean {
  return toDecimal(a).greaterThanOrEqualTo(toDecimal(b));
}

/**
 * Verifica si un valor es menor o igual que otro
 */
export function isLessThanOrEqual(
  a: number | string | Decimal,
  b: number | string | Decimal,
): boolean {
  return toDecimal(a).lessThanOrEqualTo(toDecimal(b));
}

/**
 * Verifica si un valor es cero
 */
export function isZero(value: number | string | Decimal): boolean {
  return toDecimal(value).isZero();
}

/**
 * Verifica si un valor es positivo
 */
export function isPositive(value: number | string | Decimal): boolean {
  return toDecimal(value).isPositive() && !toDecimal(value).isZero();
}

/**
 * Verifica si un valor es negativo
 */
export function isNegative(value: number | string | Decimal): boolean {
  return toDecimal(value).isNegative();
}

export { Decimal };
