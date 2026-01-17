import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { CuadreExitosoEvent } from '@modules/cuadres';
import {
  ILoteRepository,
  LOTE_REPOSITORY,
    ITandaRepository,
    TANDA_REPOSITORY,
} from '@/modules';

import { EnviarNotificacionCommand } from '@modules/notificaciones/application';

/**
 * Handler del evento CuadreExitoso
 * Según sección 23 del documento
 * 
 * Acciones:
 * 1. Actualizar dinero transferido del lote
 * 2. Liberar siguiente tanda
 * 3. Enviar notificación al vendedor
 */
@EventsHandler(CuadreExitosoEvent)
export class CuadreExitosoHandler implements IEventHandler<CuadreExitosoEvent> {
  private readonly logger = new Logger(CuadreExitosoHandler.name);

  constructor(
    @Inject(LOTE_REPOSITORY)
    private readonly loteRepository: ILoteRepository,
    @Inject(TANDA_REPOSITORY)
    private readonly tandaRepository: ITandaRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async handle(event: CuadreExitosoEvent): Promise<void> {
    this.logger.log(
      `Procesando CuadreExitosoEvent: Cuadre ${event.cuadreId}, ` +
      `Tanda ${event.numeroTanda}, Lote ${event.loteId}`,
    );

    try {
      // 1. Actualizar dinero transferido del lote
      await this.loteRepository.actualizarTransferido(
        event.loteId,
        event.montoRecibido,
      );
      this.logger.log(
        `Dinero transferido actualizado: $${event.montoRecibido.toFixed(2)}`,
      );

      // 2. Liberar siguiente tanda (si existe)
      const lote = await this.loteRepository.findById(event.loteId);
      if (!lote) {
        this.logger.error(`Lote no encontrado: ${event.loteId}`);
        return;
      }

      const siguienteNumeroTanda = event.numeroTanda + 1;
      const siguienteTanda = lote.tandas.find(
        t => t.numero === siguienteNumeroTanda && t.estado === 'INACTIVA',
      );

      if (siguienteTanda) {
        // Liberar la siguiente tanda
        await this.tandaRepository.liberar(siguienteTanda.id);
        this.logger.log(
          `Tanda ${siguienteNumeroTanda} liberada: ${siguienteTanda.id}`,
        );

        // Enviar notificación TandaLiberada
        await this.commandBus.execute(
          new EnviarNotificacionCommand(
            event.vendedorId,
            'TANDA_LIBERADA',
            {
              loteId: event.loteId,
              numeroTanda: siguienteNumeroTanda,
              cantidad: siguienteTanda.stockInicial,
            },
          ),
        );
      } else {
        // No hay siguiente tanda inactiva
        // Puede significar que es la última tanda → esperar mini-cuadre
        this.logger.log(
          `No hay siguiente tanda para liberar (tanda ${event.numeroTanda} era la última activa)`,
        );
      }

      // 3. Enviar notificación de cuadre exitoso al vendedor
      await this.commandBus.execute(
        new EnviarNotificacionCommand(
          event.vendedorId,
          'CUADRE_EXITOSO',
          {
            cuadreId: event.cuadreId,
            tandaId: event.tandaId,
            montoTransferido: Number.parseFloat(event.montoRecibido.toFixed(2)),
          },
        ),
      );

      this.logger.log(`CuadreExitosoEvent procesado exitosamente: ${event.cuadreId}`);
    } catch (error) {
      this.logger.error(
        `Error procesando CuadreExitosoEvent: ${event.cuadreId}`,
        error,
      );
      throw error;
    }
  }
}
