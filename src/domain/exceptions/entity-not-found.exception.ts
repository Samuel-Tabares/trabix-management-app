import { DomainException } from './domain.exception';

/**
 * Excepción para entidad no encontrada
 */
export class EntityNotFoundException extends DomainException {
  constructor(
    entity: string,
    identifier: string | Record<string, unknown>,
    code: string = 'ENTITY_NOT_FOUND',
  ) {
    const idStr = typeof identifier === 'string' 
      ? identifier 
      : JSON.stringify(identifier);
    
    super(
      `${entity} no encontrado: ${idStr}`,
      code,
      {
        entity,
        identifier,
      },
    );
    this.name = 'EntityNotFoundException';
  }
}
