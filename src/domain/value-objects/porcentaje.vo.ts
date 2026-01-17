import { Decimal } from 'decimal.js';
import { toDecimal } from '../../shared/utils/decimal.util';

/**
 * Value Object para Porcentajes
 * Usado para cálculos de inversión y ganancias
 * Según secciones 2.2, 2.4, 2.5 del documento
 */
export class Porcentaje {
  private readonly _value: Decimal;

  private constructor(value: Decimal) {
    this._value = value;
  }

  /**
   * Crea una instancia de Porcentaje validada (0-100)
   */
  static create(value: number | string | Decimal): Porcentaje {
    const decimal = toDecimal(value);
    
    if (decimal.isNegative()) {
      throw new Error('El porcentaje no puede ser negativo');
    }

    if (decimal.greaterThan(100)) {
      throw new Error('El porcentaje no puede ser mayor a 100');
    }

    return new Porcentaje(decimal);
  }

  /**
   * Crea un porcentaje de 0%
   */
  static zero(): Porcentaje {
    return new Porcentaje(new Decimal(0));
  }

  /**
   * Crea un porcentaje de 50% (usado para inversión 50/50)
   */
  static fifty(): Porcentaje {
    return new Porcentaje(new Decimal(50));
  }

  /**
   * Crea un porcentaje de 60% (usado para modelo 60/40)
   */
  static sixty(): Porcentaje {
    return new Porcentaje(new Decimal(60));
  }

  /**
   * Crea un porcentaje de 40% (usado para modelo 60/40)
   */
  static forty(): Porcentaje {
    return new Porcentaje(new Decimal(40));
  }

  /**
   * Obtiene el valor del porcentaje
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
    return `${this._value.toString()}%`;
  }

  /**
   * Obtiene el valor como decimal (0-1)
   * Útil para multiplicaciones directas
   */
  toDecimalFactor(): Decimal {
    return this._value.dividedBy(100);
  }

  /**
   * Aplica el porcentaje a un valor
   * @param value - Valor base
   * @returns El resultado de aplicar el porcentaje
   */
  applyTo(value: number | string | Decimal): Decimal {
    return toDecimal(value).times(this._value).dividedBy(100);
  }

  /**
   * Suma dos porcentajes (máximo 100%)
   */
  add(other: Porcentaje): Porcentaje {
    const result = this._value.plus(other._value);
    if (result.greaterThan(100)) {
      throw new Error('La suma de porcentajes no puede superar 100%');
    }
    return new Porcentaje(result);
  }

  /**
   * Resta dos porcentajes (mínimo 0%)
   */
  subtract(other: Porcentaje): Porcentaje {
    const result = this._value.minus(other._value);
    if (result.isNegative()) {
      throw new Error('La resta de porcentajes no puede ser negativa');
    }
    return new Porcentaje(result);
  }

  /**
   * Obtiene el complemento (100 - valor)
   */
  complement(): Porcentaje {
    return new Porcentaje(new Decimal(100).minus(this._value));
  }

  /**
   * Verifica si es igual a otro porcentaje
   */
  equals(other: Porcentaje): boolean {
    return this._value.equals(other._value);
  }

  /**
   * Verifica si es cero
   */
  isZero(): boolean {
    return this._value.isZero();
  }

  /**
   * Verifica si es el máximo (100%)
   */
  isFull(): boolean {
    return this._value.equals(100);
  }
}
