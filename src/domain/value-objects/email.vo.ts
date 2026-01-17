/**
 * Value Object para correo electrónico
 * Según sección 1.2: El email es un dato requerido del usuario
 */
export class Email {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value.toLowerCase().trim();
  }

  /**
   * Crea una instancia de Email validada
   */
  static create(value: string): Email {
    if (!value || typeof value !== 'string') {
      throw new Error('El correo electrónico es requerido');
    }

    const trimmed = value.trim();
    
    if (!Email.isValid(trimmed)) {
      throw new Error('El formato del correo electrónico es inválido');
    }

    return new Email(trimmed);
  }

  /**
   * Valida el formato de un email
   */
  static isValid(email: string): boolean {
    // Regex estándar para validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      return false;
    }

    // Validaciones adicionales
    if (email.length > 254) {
      return false;
    }

    const [localPart, domain] = email.split('@');
    
    if (!localPart || localPart.length > 64) {
      return false;
    }

    if (!domain || domain.length > 253) {
      return false;
    }

    return true;
  }

  /**
   * Obtiene el valor del email
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
   * Obtiene el dominio del email
   */
  getDomain(): string {
    return this._value.split('@')[1];
  }

  /**
   * Obtiene la parte local del email (antes del @)
   */
  getLocalPart(): string {
    return this._value.split('@')[0];
  }

  /**
   * Verifica si es igual a otro email
   */
  equals(other: Email): boolean {
    return this._value === other._value;
  }
}
