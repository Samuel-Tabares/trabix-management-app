import { DomainException } from './domain.exception';

/**
 * Excepción para conflictos de concurrencia
 * Según sección 18.4 - Optimistic Locking
 */
export class ConcurrencyException extends DomainException {
  constructor(
    entity: string,
    id: string,
    expectedVersion: number,
    details?: Record<string, unknown>,
  ) {
    super(
      `Conflicto de concurrencia en ${entity}: el registro fue modificado por otro proceso`,
      'CONFLICT',
      {
        entity,
        id,
        expectedVersion,
        action: 'Reintentar la operación',
        ...details,
      },
    );
    this.name = 'ConcurrencyException';
  }
}
