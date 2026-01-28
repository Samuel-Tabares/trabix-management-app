import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { MiniCuadreExitosoEvent } from './mini-cuadre-exitoso.event';
import { EnviarNotificacionCommand } from '../../../notificaciones/application/commands';

/**
 * Handler del evento MiniCuadreExitoso
 *
 * Acciones:
 * 1. Las acciones principales (finalizar tanda y lote) ya se ejecutaron en el command
 * 2. Enviar notificación al vendedor
 */
@EventsHandler(MiniCuadreExitosoEvent)
export class MiniCuadreExitosoHandler
    implements IEventHandler<MiniCuadreExitosoEvent>
{
    private readonly logger = new Logger(MiniCuadreExitosoHandler.name);

    constructor(private readonly commandBus: CommandBus) {}

    async handle(event: MiniCuadreExitosoEvent): Promise<void> {
        const montoFinalFormatted = event.getMontoFinalFormatted();
        const montoFinalNumero = event.getMontoFinalAsNumber();

        this.logger.log(
            `Procesando MiniCuadreExitosoEvent: ${event.miniCuadreId} - ` +
            `Lote: ${event.loteId} - ` +
            `Vendedor: ${event.vendedorId} - ` +
            `Monto final: $${montoFinalFormatted}`,
        );

        try {
            // Enviar notificación al vendedor - lote finalizado
            await this.commandBus.execute(
                new EnviarNotificacionCommand(event.vendedorId, 'MANUAL', {
                    titulo: '🎊 ¡Lote Finalizado!',
                    mensaje: `Tu lote ha sido completado exitosamente. Monto final: $${montoFinalFormatted}`,
                    loteId: event.loteId,
                    miniCuadreId: event.miniCuadreId,
                    montoFinal: montoFinalNumero,
                }),
            );

            this.logger.log(
                `MiniCuadreExitosoEvent procesado: ${event.miniCuadreId} - Lote ${event.loteId} FINALIZADO`,
            );
        } catch (error) {
            this.logger.error(
                `Error procesando MiniCuadreExitosoEvent: ${event.miniCuadreId}`,
                error,
            );
            throw error;
        }
    }
}