import { v4 as uuidv4 } from 'uuid';

/**
 * Interfaz base para eventos de dominio
 * 
 * Los eventos de dominio representan hechos que ocurrieron en el sistema.
 * Son inmutables y se persisten para auditoría y event sourcing.
 */
export interface IDomainEvent {
  /**
   * ID único del evento
   */
  readonly eventId: string;

  /**
   * Tipo del evento (para deserialización)
   */
  readonly eventType: string;

  /**
   * Versión del esquema del evento
   */
  readonly eventVersion: number;

  /**
   * ID del aggregate que generó el evento
   */
  readonly aggregateId: string;

  /**
   * Tipo del aggregate
   */
  readonly aggregateType: string;

  /**
   * Fecha y hora en que ocurrió el evento
   */
  readonly occurredOn: Date;

  /**
   * Datos del evento
   */
  readonly payload: Record<string, any>;

  /**
   * Metadatos adicionales (userId, correlationId, etc.)
   */
  readonly metadata?: EventMetadata;
}

/**
 * Metadatos del evento
 */
export interface EventMetadata {
  /**
   * ID del usuario que generó el evento
   */
  userId?: string;

  /**
   * ID de correlación para trazabilidad
   */
  correlationId?: string;

  /**
   * ID de causación (evento que causó este evento)
   */
  causationId?: string;

  /**
   * Timestamp del servidor
   */
  timestamp?: Date;

  /**
   * Información adicional
   */
  [key: string]: any;
}

/**
 * Clase base abstracta para eventos de dominio
 */
export abstract class BaseDomainEvent implements IDomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly eventVersion: number = 1;
  readonly metadata?: EventMetadata;

  /**
   * Tipo del evento - debe ser implementado por cada evento concreto
   */
  abstract readonly eventType: string;

  /**
   * Tipo del aggregate - debe ser implementado por cada evento concreto
   */
  abstract readonly aggregateType: string;

  /**
   * ID del aggregate
   */
  abstract readonly aggregateId: string;

  /**
   * Datos del evento - debe ser implementado por cada evento concreto
   */
  abstract readonly payload: Record<string, any>;

  constructor(metadata?: EventMetadata) {
    this.eventId = uuidv4();
    this.occurredOn = new Date();
    this.metadata = {
      ...metadata,
      timestamp: new Date(),
    };
  }

  /**
   * Serializa el evento para persistencia
   */
  toJSON(): Record<string, any> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      eventVersion: this.eventVersion,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      occurredOn: this.occurredOn.toISOString(),
      payload: this.payload,
      metadata: this.metadata,
    };
  }
}

/**
 * Tipos de aggregate del sistema TRABIX
 */
export enum AggregateType {
  USUARIO = 'Usuario',
  LOTE = 'Lote',
  TANDA = 'Tanda',
  VENTA = 'Venta',
  VENTA_MAYOR = 'VentaMayor',
  CUADRE = 'Cuadre',
  CUADRE_MAYOR = 'CuadreMayor',
  MINI_CUADRE = 'MiniCuadre',
  EQUIPAMIENTO = 'Equipamiento',
  FONDO_RECOMPENSAS = 'FondoRecompensas',
  NOTIFICACION = 'Notificacion',
}

/**
 * Helper para crear ID de correlación
 */
export function createCorrelationId(): string {
  return uuidv4();
}

/**
 * Helper para crear metadata con userId
 */
export function createEventMetadata(userId?: string): EventMetadata {
  return {
    userId,
    correlationId: createCorrelationId(),
    timestamp: new Date(),
  };
}
