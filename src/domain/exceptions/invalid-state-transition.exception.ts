import { DomainException } from './domain.exception';

/**
 * Excepción para transiciones de estado inválidas
 * Usado principalmente en el State Pattern de Tandas
 * Según sección 4.2 del documento
 */
export class InvalidStateTransitionException extends DomainException {
  constructor(
    entity: string,
    currentState: string,
    targetState: string,
    details?: Record<string, unknown>,
  ) {
    super(
      `Transición de estado inválida en ${entity}: ${currentState} → ${targetState}`,
      'TND_002',
      {
        entity,
        currentState,
        targetState,
        ...details,
      },
    );
    this.name = 'InvalidStateTransitionException';
  }
}
