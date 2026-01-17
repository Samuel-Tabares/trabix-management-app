import { Decimal } from 'decimal.js';
import { toDecimal, roundToMoney, isNegative } from '../../shared/utils/decimal.util';

/**
 * Value Object para representar dinero
 * Según sección 0.3: No existen TRABIX fraccionarios
 * Usa Decimal.js para precisión financiera
 */
export class Money {
  private readonly _value: Decimal;

  private constructor(value: Decimal) {
    this._value = roundToMoney(value);
  }

  /**
   * Crea una instancia de Money desde un número o string
   */
  static create(value: number | string | Decimal): Money {
    const decimal = toDecimal(value);
    
    if (isNegative(decimal)) {
      throw new Error('El monto no puede ser negativo');
    }

    return new Money(decimal);
  }

  /**
   * Crea una instancia de Money con valor cero
   */
  static zero(): Money {
    return new Money(new Decimal(0));
  }

  /**
   * Crea una instancia de Money desde pesos colombianos (entero)
   */
  static fromCOP(pesos: number): Money {
    if (!Number.isInteger(pesos) || pesos < 0) {
      throw new Error('Los pesos deben ser un entero no negativo');
    }
    return new Money(new Decimal(pesos));
  }

  /**
   * Obtiene el valor como Decimal
   */
  get value(): Decimal {
    return this._value;
  }

  /**
   * Obtiene el valor como número
   */
  toNumber(): number {
    return this._value.toNumber();
  }

  /**
   * Obtiene el valor como string
   */
  toString(): string {
    return this._value.toString();
  }

  /**
   * Suma dos montos
   */
  add(other: Money): Money {
    return new Money(this._value.plus(other._value));
  }

  /**
   * Resta dos montos (no permite negativos)
   */
  subtract(other: Money): Money {
    const result = this._value.minus(other._value);
    if (result.isNegative()) {
      throw new Error('La resta resulta en un monto negativo');
    }
    return new Money(result);
  }

  /**
   * Multiplica por un factor
   */
  multiply(factor: number | Decimal): Money {
    return new Money(this._value.times(toDecimal(factor)));
  }

  /**
   * Divide por un divisor
   */
  divide(divisor: number | Decimal): Money {
    const d = toDecimal(divisor);
    if (d.isZero()) {
      throw new Error('No se puede dividir por cero');
    }
    return new Money(this._value.dividedBy(d));
  }

  /**
   * Calcula un porcentaje del monto
   */
  percentage(percent: number): Money {
    return new Money(this._value.times(percent).dividedBy(100));
  }

  /**
   * Verifica si es igual a otro monto
   */
  equals(other: Money): boolean {
    return this._value.equals(other._value);
  }

  /**
   * Verifica si es mayor que otro monto
   */
  isGreaterThan(other: Money): boolean {
    return this._value.greaterThan(other._value);
  }

  /**
   * Verifica si es mayor o igual que otro monto
   */
  isGreaterThanOrEqual(other: Money): boolean {
    return this._value.greaterThanOrEqualTo(other._value);
  }

  /**
   * Verifica si es menor que otro monto
   */
  isLessThan(other: Money): boolean {
    return this._value.lessThan(other._value);
  }

  /**
   * Verifica si es cero
   */
  isZero(): boolean {
    return this._value.isZero();
  }

  /**
   * Verifica si es positivo
   */
  isPositive(): boolean {
    return this._value.isPositive() && !this._value.isZero();
  }

  /**
   * Formatea como moneda colombiana
   */
  formatCOP(): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(this._value.toNumber());
  }
}
