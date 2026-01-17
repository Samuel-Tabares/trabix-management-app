import { ICommand } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Clase base para todos los Commands del sistema
 * 
 * Los Commands representan intenciones de cambiar el estado del sistema.
 * Son inmutables una vez creados.
 * 
 * Convenciones:
 * - Nombrar en infinitivo: CrearLoteCommand, AprobarVentaCommand
 * - Deben ser serializables (para outbox/event sourcing)
 * - No deben contener lógica de negocio
 */
export abstract class BaseCommand implements ICommand {
  /**
   * ID único del command para trazabilidad
   */
  readonly commandId: string;

  /**
   * Timestamp de cuando se creó el command
   */
  readonly timestamp: Date;

  /**
   * ID del usuario que ejecuta el command (opcional)
   */
  readonly userId?: string;

  /**
   * Clave de idempotencia para evitar duplicados
   */
  readonly idempotencyKey?: string;

  constructor(userId?: string, idempotencyKey?: string) {
    this.commandId = uuidv4();
    this.timestamp = new Date();
    this.userId = userId;
    this.idempotencyKey = idempotencyKey;
  }

  /**
   * Nombre del command para logging/eventos
   */
  abstract get commandName(): string;

  /**
   * Convierte el command a un objeto serializable
   */
  toJSON(): Record<string, any> {
    return {
      commandId: this.commandId,
      commandName: this.commandName,
      timestamp: this.timestamp.toISOString(),
      userId: this.userId,
      idempotencyKey: this.idempotencyKey,
    };
  }
}

/**
 * Interfaz para Command Handlers con resultado tipado
 */
export interface ITypedCommandHandler<TCommand extends ICommand, TResult> {
  execute(command: TCommand): Promise<TResult>;
}

/**
 * Resultado estándar para commands que crean entidades
 */
export interface CreateCommandResult {
  id: string;
  createdAt: Date;
}

/**
 * Resultado estándar para commands que actualizan entidades
 */
export interface UpdateCommandResult {
  id: string;
  updatedAt: Date;
  version?: number;
}

/**
 * Resultado estándar para commands que eliminan entidades
 */
export interface DeleteCommandResult {
  id: string;
  deletedAt: Date;
}
