/**
 * Patrón Specification
 * 
 * Las especificaciones encapsulan reglas de negocio complejas que determinan
 * si una entidad cumple con ciertos criterios.
 * 
 * Beneficios:
 * - Reglas reutilizables
 * - Combinables (AND, OR, NOT)
 * - Testeables de forma aislada
 * - Expresivas y autodocumentadas
 */

/**
 * Interfaz base para especificaciones
 */
export interface ISpecification<T> {
  /**
   * Evalúa si el candidato cumple con la especificación
   */
  isSatisfiedBy(candidate: T): boolean;

  /**
   * Combina esta especificación con otra usando AND
   */
  and(other: ISpecification<T>): ISpecification<T>;

  /**
   * Combina esta especificación con otra usando OR
   */
  or(other: ISpecification<T>): ISpecification<T>;

  /**
   * Niega esta especificación
   */
  not(): ISpecification<T>;
}

/**
 * Clase base abstracta para especificaciones
 * Implementa los operadores de combinación
 */
export abstract class BaseSpecification<T> implements ISpecification<T> {
  /**
   * Método que debe ser implementado por las especificaciones concretas
   */
  abstract isSatisfiedBy(candidate: T): boolean;

  /**
   * Combina con AND
   */
  and(other: ISpecification<T>): ISpecification<T> {
    return new AndSpecification(this, other);
  }

  /**
   * Combina con OR
   */
  or(other: ISpecification<T>): ISpecification<T> {
    return new OrSpecification(this, other);
  }

  /**
   * Niega la especificación
   */
  not(): ISpecification<T> {
    return new NotSpecification(this);
  }
}

/**
 * Especificación AND
 */
class AndSpecification<T> extends BaseSpecification<T> {
  constructor(
    private readonly left: ISpecification<T>,
    private readonly right: ISpecification<T>,
  ) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return (
      this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate)
    );
  }
}

/**
 * Especificación OR
 */
class OrSpecification<T> extends BaseSpecification<T> {
  constructor(
    private readonly left: ISpecification<T>,
    private readonly right: ISpecification<T>,
  ) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return (
      this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate)
    );
  }
}

/**
 * Especificación NOT
 */
class NotSpecification<T> extends BaseSpecification<T> {
  constructor(private readonly spec: ISpecification<T>) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return !this.spec.isSatisfiedBy(candidate);
  }
}

/**
 * Resultado de validación con detalles
 */
export interface SpecificationResult {
  isSatisfied: boolean;
  reason?: string;
  details?: Record<string, any>;
}

/**
 * Especificación con resultado detallado
 */
export abstract class DetailedSpecification<T> extends BaseSpecification<T> {
  /**
   * Evalúa la especificación y retorna resultado detallado
   */
  abstract evaluate(candidate: T): SpecificationResult;

  /**
   * Implementación de isSatisfiedBy usando evaluate
   */
  isSatisfiedBy(candidate: T): boolean {
    return this.evaluate(candidate).isSatisfied;
  }
}

/**
 * Helper para crear especificación simple desde una función
 */
export function createSpecification<T>(
  predicate: (candidate: T) => boolean,
): ISpecification<T> {
  return new (class extends BaseSpecification<T> {
    isSatisfiedBy(candidate: T): boolean {
      return predicate(candidate);
    }
  })();
}
