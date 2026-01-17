import { v4 as uuidv4 } from 'uuid';

/**
 * Clase base para todas las entidades del dominio
 * 
 * Proporciona:
 * - ID único (UUID)
 * - Timestamps de creación/actualización
 * - Métodos de comparación
 * - Validación de invariantes
 */
export abstract class BaseEntity<TProps> {
  protected readonly _id: string;
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;
  protected props: TProps;

  constructor(props: TProps, id?: string) {
    this._id = id ?? uuidv4();
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this.props = props;
    this.validateInvariants();
  }

  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Valida las invariantes de la entidad
   * Debe ser implementado por las entidades hijas
   */
  protected abstract validateInvariants(): void;

  /**
   * Actualiza la fecha de modificación
   */
  protected markAsUpdated(): void {
    this._updatedAt = new Date();
  }

  /**
   * Compara dos entidades por su ID
   */
  equals(entity?: BaseEntity<TProps>): boolean {
    if (!entity) return false;
    if (this === entity) return true;
    return this._id === entity._id;
  }
}

/**
 * Clase base para entidades con versión (optimistic locking)
 */
export abstract class VersionedEntity<TProps> extends BaseEntity<TProps> {
  protected _version: number;

  constructor(props: TProps, id?: string, version: number = 1) {
    super(props, id);
    this._version = version;
  }

  get version(): number {
    return this._version;
  }

  /**
   * Incrementa la versión al actualizar
   */
  protected incrementVersion(): void {
    this._version++;
    this.markAsUpdated();
  }
}

/**
 * Clase base para aggregate roots
 * Un aggregate root es la entidad principal que controla el acceso a un conjunto de entidades relacionadas
 */
export abstract class AggregateRoot<TProps> extends VersionedEntity<TProps> {
  private _domainEvents: DomainEvent[] = [];

  /**
   * Agrega un evento de dominio para ser publicado
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Obtiene y limpia los eventos de dominio pendientes
   */
  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  /**
   * Verifica si hay eventos pendientes
   */
  hasDomainEvents(): boolean {
    return this._domainEvents.length > 0;
  }
}

/**
 * Interfaz base para eventos de dominio
 * La implementación completa está en ./events/base.event.ts
 */
export interface DomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly eventType: string;
}
