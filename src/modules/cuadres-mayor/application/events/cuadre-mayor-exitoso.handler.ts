import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { CuadreMayorExitosoEvent } from './cuadre-mayor-exitoso.event';
import { EnviarNotificacionCommand } from '@modules/notificaciones/application';

/**
 * Handler del evento CuadreMayorExitoso
 * 
 * Acciones según sección 23:
 * 1. Liberar tandas en cadena si corresponde (ya se hace en el command)
 * 2. Enviar notificaciones
 */
@EventsHandler(CuadreMayorExitosoEvent)
export class CuadreMayorExitosoHandler
  implements IEventHandler<CuadreMayorExitosoEvent>
{
  private readonly logger = new Logger(CuadreMayorExitosoHandler.name);

  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: CuadreMayorExitosoEvent): Promise<void> {
    this.logger.log(
      `Procesando CuadreMayorExitosoEvent: ${event.cuadreMayorId} - ` +
      `Vendedor: ${event.vendedorId} - ` +
      `Lotes: ${event.lotesInvolucradosIds.length} - ` +
      `Cuadres cerrados: ${event.cuadresCerradosIds.length}`,
    );

    try {
      // Enviar notificación al vendedor sobre el cuadre al mayor exitoso
      await this.commandBus.execute(
        new EnviarNotificacionCommand(
          event.vendedorId,
          'CUADRE_EXITOSO',
          {
            cuadreMayorId: event.cuadreMayorId,
            lotesInvolucrados: event.lotesInvolucradosIds.length,
            cuadresCerrados: event.cuadresCerradosIds.length,
            esVentaAlMayor: true,
          },
        ),
      );
      
      this.logger.log(
        `CuadreMayorExitosoEvent procesado: ${event.cuadreMayorId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error procesando CuadreMayorExitosoEvent: ${event.cuadreMayorId}`,
        error,
      );
      throw error;
    }
  }
}
