import { IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

/**
 * Interfaz base para eventos de dominio
 */
export interface IDomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly eventType: string;
}

/**
 * Clase base para Event Handlers
 * 
 * Proporciona:
 * - Logging automático de eventos procesados
 * - Manejo de errores estándar
 * - Métricas de procesamiento
 * 
 * Convenciones:
 * - Un handler por evento
 * - Handlers deben ser idempotentes (pueden ejecutarse múltiples veces)
 * - No deben lanzar excepciones que detengan el flujo
 */
export abstract class BaseEventHandler<TEvent extends IDomainEvent>
  implements IEventHandler<TEvent>
{
  protected abstract readonly logger: Logger;

  /**
   * Nombre del handler para logging
   */
  abstract get handlerName(): string;

  /**
   * Lógica principal del handler
   * Debe ser implementada por las clases hijas
   */
  protected abstract processEvent(event: TEvent): Promise<void>;

  /**
   * Método principal que procesa el evento con logging y manejo de errores
   */
  async handle(event: TEvent): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `[${this.handlerName}] Procesando evento ${event.eventType} ` +
          `(eventId: ${event.eventId}, aggregateId: ${event.aggregateId})`,
      );

      await this.processEvent(event);

      const duration = Date.now() - startTime;
      this.logger.log(
        `[${this.handlerName}] Evento procesado exitosamente en ${duration}ms`,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      this.logger.error(
        `[${this.handlerName}] Error procesando evento ${event.eventType} ` +
          `después de ${duration}ms: ${errorMessage}`,
        errorStack,
      );

      // Llamar hook de error para manejo personalizado
      const errorObj = error instanceof Error ? error : new Error(String(error));
      await this.onError(event, errorObj);
    }
  }

  /**
   * Hook para manejo personalizado de errores
   * Puede ser sobrescrito por handlers hijos
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async onError(_event: TEvent, _error: Error): Promise<void> {
    // Por defecto no hace nada adicional
    // Los handlers pueden sobrescribir para reintentar, notificar, etc.
  }
}

/**
 * Decorator para marcar handlers como idempotentes
 * Los handlers idempotentes deben poder ejecutarse múltiples veces
 * con el mismo evento sin efectos secundarios adicionales
 */
const idempotentHandlers = new WeakSet<Function>();

export function Idempotent(): ClassDecorator {
  return (target: Function) => {
    idempotentHandlers.add(target);
  };
}

/**
 * Helper para verificar si un handler es idempotente
 */
export function isIdempotent(handler: unknown): boolean {
  if (!handler || typeof handler !== 'object') return false;
  return idempotentHandlers.has(handler.constructor as Function);
}

/**
 * Tipos de eventos del sistema TRABIX
 */
export enum TrabixEventType {
  // Lotes
  LOTE_CREADO = 'lote.creado',
  LOTE_ACTIVADO = 'lote.activado',
  LOTE_FINALIZADO = 'lote.finalizado',

  // Tandas
  TANDA_LIBERADA = 'tanda.liberada',
  TANDA_EN_TRANSITO = 'tanda.en_transito',
  TANDA_EN_CASA = 'tanda.en_casa',
  TANDA_FINALIZADA = 'tanda.finalizada',

  // Ventas
  VENTA_REGISTRADA = 'venta.registrada',
  VENTA_APROBADA = 'venta.aprobada',
  VENTA_RECHAZADA = 'venta.rechazada',

  // Ventas al Mayor
  VENTA_MAYOR_REGISTRADA = 'venta_mayor.registrada',
  VENTA_MAYOR_COMPLETADA = 'venta_mayor.completada',

  // Cuadres
  CUADRE_ACTIVADO = 'cuadre.activado',
  CUADRE_EXITOSO = 'cuadre.exitoso',
  CUADRE_CERRADO_POR_MAYOR = 'cuadre.cerrado_por_mayor',

  // Mini-cuadre
  MINI_CUADRE_ACTIVADO = 'mini_cuadre.activado',
  MINI_CUADRE_EXITOSO = 'mini_cuadre.exitoso',

  // Cuadre Mayor
  CUADRE_MAYOR_CREADO = 'cuadre_mayor.creado',
  CUADRE_MAYOR_EXITOSO = 'cuadre_mayor.exitoso',

  // Equipamiento
  EQUIPAMIENTO_SOLICITADO = 'equipamiento.solicitado',
  EQUIPAMIENTO_ACTIVADO = 'equipamiento.activado',
  EQUIPAMIENTO_DANADO = 'equipamiento.danado',
  EQUIPAMIENTO_PERDIDO = 'equipamiento.perdido',
  EQUIPAMIENTO_DEVUELTO = 'equipamiento.devuelto',

  // Fondo de Recompensas
  FONDO_ENTRADA = 'fondo.entrada',
  FONDO_SALIDA = 'fondo.salida',

  // Usuarios
  USUARIO_CREADO = 'usuario.creado',
  USUARIO_DESACTIVADO = 'usuario.desactivado',
}
