/**
 * Value Object para Cédula de Ciudadanía Colombiana
 * Según sección 1.2: La cédula es un dato requerido del usuario
 * ACTUALIZADO: Ahora usa number (Int) en lugar de string
 */
export class Cedula {
    private readonly _value: number;

    private constructor(value: number) {
        this._value = value;
    }

    /**
     * Crea una instancia de Cedula validada desde un número
     */
    static create(value: number): Cedula {
        if (value === null || value === undefined) {
            throw new Error('La cédula es requerida');
        }

        if (typeof value !== 'number' || !Number.isInteger(value)) {
            throw new Error('La cédula debe ser un número entero');
        }

        if (!Cedula.isValid(value)) {
            throw new Error('El formato de la cédula es inválido');
        }

        return new Cedula(value);
    }

    /**
     * Crea una instancia de Cedula desde un string (para compatibilidad)
     */
    static fromString(value: string): Cedula {
        if (!value || typeof value !== 'string') {
            throw new Error('La cédula es requerida');
        }

        // Remover espacios y puntos
        const cleaned = value.replace(/[\s.]/g, '').trim();

        const numericValue = parseInt(cleaned, 10);

        if (isNaN(numericValue)) {
            throw new Error('La cédula debe contener solo números');
        }

        return Cedula.create(numericValue);
    }

    /**
     * Valida el formato de una cédula colombiana
     */
    static isValid(cedula: number): boolean {
        // Debe ser un entero positivo
        if (!Number.isInteger(cedula) || cedula <= 0) {
            return false;
        }

        // Convertir a string para validar longitud
        const cedulaStr = cedula.toString();

        // Longitud entre 6 y 10 dígitos
        if (cedulaStr.length < 6 || cedulaStr.length > 10) {
            return false;
        }

        return true;
    }

    /**
     * Obtiene el valor de la cédula como número
     */
    get value(): number {
        return this._value;
    }

    /**
     * Obtiene el valor como string
     */
    toString(): string {
        return this._value.toString();
    }

    /**
     * Obtiene el valor como número
     */
    toNumber(): number {
        return this._value;
    }

    /**
     * Formatea la cédula con puntos de miles (formato colombiano)
     * Ejemplo: 1234567890 -> 1.234.567.890
     */
    format(): string {
        return this._value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    /**
     * Verifica si es igual a otra cédula
     */
    equals(other: Cedula): boolean {
        return this._value === other._value;
    }
}