import { DomainException } from './domain.exception';

/**
 * Excepción para violación de reglas de negocio
 * Usada cuando se viola una regla del documento de especificación
 */
export class BusinessRuleViolationException extends DomainException {
  constructor(
    rule: string,
    code: string,
    details?: Record<string, unknown>,
  ) {
    super(
      `Violación de regla de negocio: ${rule}`,
      code,
      details,
    );
    this.name = 'BusinessRuleViolationException';
  }
}
