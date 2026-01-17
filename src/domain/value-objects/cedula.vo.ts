/**
 * Value Object para Cédula de Ciudadanía Colombiana
 * Según sección 1.2: La cédula es un dato requerido del usuario
 */
export class Cedula {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  /**
   * Crea una instancia de Cedula validada
   */
  static create(value: string): Cedula {
    if (!value || typeof value !== 'string') {
      throw new Error('La cédula es requerida');
    }

    // Remover espacios y puntos
    const cleaned = value.replace(/[\s.]/g, '').trim();
    
    if (!Cedula.isValid(cleaned)) {
      throw new Error('El formato de la cédula es inválido');
    }

    return new Cedula(cleaned);
  }

  /**
   * Valida el formato de una cédula colombiana
   */
  static isValid(cedula: string): boolean {
    // La cédula colombiana debe contener solo números
    if (!/^\d+$/.test(cedula)) {
      return false;
    }

    // Longitud entre 6 y 10 dígitos
    if (cedula.length < 6 || cedula.length > 10) {
      return false;
    }

    // No puede ser todos ceros
    if (/^0+$/.test(cedula)) {
      return false;
    }

    return true;
  }

  /**
   * Obtiene el valor de la cédula
   */
  get value(): string {
    return this._value;
  }

  /**
   * Obtiene el valor como string
   */
  toString(): string {
    return this._value;
  }

  /**
   * Formatea la cédula con puntos de miles (formato colombiano)
   * Ejemplo: 1234567890 -> 1.234.567.890
   */
  format(): string {
    return this._value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  /**
   * Verifica si es igual a otra cédula
   */
  equals(other: Cedula): boolean {
    return this._value === other._value;
  }
}
