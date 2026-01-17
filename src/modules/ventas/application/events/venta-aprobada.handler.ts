import { EventsHandler, IEventHandler, CommandBus, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { VentaAprobadaEvent } from '@modules/ventas';

import {
  ITandaRepository,
  TANDA_REPOSITORY,
    CalculadoraTandasService,
    ILoteRepository,
    LOTE_REPOSITORY,
} from '@/modules';

import {
  ICuadreRepository,
  CUADRE_REPOSITORY,
    ActivarCuadreCommand
} from '@modules/cuadres';
import { StockUltimaTandaAgotadoEvent } from '@modules/mini-cuadres/application';
import { EnviarNotificacionCommand } from '@modules/notificaciones/application';

/**
 * Handler del evento VentaAprobada
 * Según sección 23 del documento
 * 
 * Acciones:
 * 1. Actualizar stock de tanda (ya reducido temporalmente, confirmar)
 * 2. Actualizar dinero recaudado del lote
 * 3. Verificar trigger de cuadre (dinero o %)
 * 4. Si stock <= 25%: Enviar notificación
 * 5. Si inversión recuperada: Enviar notificación
 * 6. Si última tanda llega a 0: Activar mini-cuadre
 */
@EventsHandler(VentaAprobadaEvent)
export class VentaAprobadaHandler implements IEventHandler<VentaAprobadaEvent> {
  private readonly logger = new Logger(VentaAprobadaHandler.name);

  constructor(
    @Inject(LOTE_REPOSITORY)
    private readonly loteRepository: ILoteRepository,
    @Inject(TANDA_REPOSITORY)
    private readonly tandaRepository: ITandaRepository,
    @Inject(CUADRE_REPOSITORY)
    private readonly cuadreRepository: ICuadreRepository,
    private readonly calculadoraTandas: CalculadoraTandasService,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
  ) {}

    async handle(event: VentaAprobadaEvent): Promise<void> {
        this.logInicio(event);

        try {
            await this.loteRepository.actualizarRecaudado(
                event.loteId,
                event.montoTotal,
            );

            const contexto = await this.obtenerContexto(event);
            if (!contexto) return;

            const { lote, tanda, triggerResult, dineroRecaudado } = contexto;

            await this.manejarCuadre(triggerResult, tanda);
            await this.manejarStockBajo(triggerResult, tanda, event.vendedorId);
            await this.manejarInversionRecuperada(
                lote,
                dineroRecaudado,
                event,
            );
            await this.manejarFinalizacionTanda(lote, tanda, event);

            this.logger.log(`VentaAprobadaEvent procesado exitosamente: ${event.ventaId}`);
        } catch (error) {
            this.logger.error(
                `Error procesando VentaAprobadaEvent: ${event.ventaId}`,
                error,
            );
            throw error;
        }
    }
    private logInicio(event: VentaAprobadaEvent): void {
        this.logger.log(
            `Procesando VentaAprobadaEvent: Venta ${event.ventaId}, ` +
            `Lote ${event.loteId}, Monto $${event.montoTotal.toFixed(2)}`,
        );
    }
    private async obtenerContexto(event: VentaAprobadaEvent) {
        const lote = await this.loteRepository.findById(event.loteId);
        const tanda = await this.tandaRepository.findById(event.tandaId);

        if (!lote || !tanda) {
            this.logger.error(
                `Lote o tanda no encontrados: ${event.loteId}, ${event.tandaId}`,
            );
            return null;
        }

        const dineroRecaudado = new Decimal(lote.dineroRecaudado);
        const inversionAdmin = new Decimal(lote.inversionAdmin);

        const triggerResult = this.calculadoraTandas.verificarTriggerCuadre(
            tanda.numero,
            lote.tandas.length,
            tanda.stockActual,
            tanda.stockInicial,
            dineroRecaudado,
            inversionAdmin,
        );

        return { lote, tanda, triggerResult, dineroRecaudado };
    }
    private async manejarCuadre(triggerResult: any, tanda: any): Promise<void> {
        if (!triggerResult.debeDisparar) return;

        this.logger.log(
            `Trigger de cuadre detectado para tanda ${tanda.numero}: ${triggerResult.razon}`,
        );

        const cuadre = await this.cuadreRepository.findByTandaId(tanda.id);
        if (cuadre?.estado === 'INACTIVO') {
            await this.commandBus.execute(
                new ActivarCuadreCommand(cuadre.id),
            );
            this.logger.log(`Cuadre ${cuadre.id} activado para tanda ${tanda.numero}`);
        }
    }
    private async manejarStockBajo(
        triggerResult: any,
        tanda: any,
        vendedorId: string,
    ): Promise<void> {
        if (triggerResult.porcentajeStock > 25 || triggerResult.porcentajeStock <= 0) {
            return;
        }

        this.logger.log(
            `Stock bajo (${triggerResult.porcentajeStock.toFixed(1)}%) en tanda ${tanda.numero}`,
        );

        await this.commandBus.execute(
            new EnviarNotificacionCommand(
                vendedorId,
                'STOCK_BAJO',
                { tandaId: tanda.id, porcentaje: triggerResult.porcentajeStock },
            ),
        );
    }
    private async manejarInversionRecuperada(
        lote: any,
        dineroRecaudado: Decimal,
        event: VentaAprobadaEvent,
    ): Promise<void> {
        const inversionTotal = new Decimal(lote.inversionTotal);

        if (!dineroRecaudado.greaterThanOrEqualTo(inversionTotal)) return;

        const seRecuperoAhora = new Decimal(lote.dineroRecaudado)
            .minus(event.montoTotal)
            .lessThan(inversionTotal);

        if (!seRecuperoAhora) return;

        this.logger.log(
            `¡Inversión recuperada! Lote ${event.loteId}: ` +
            `$${dineroRecaudado.toFixed(2)} >= $${inversionTotal.toFixed(2)}`,
        );

        await this.commandBus.execute(
            new EnviarNotificacionCommand(
                event.vendedorId,
                'INVERSION_RECUPERADA',
                { loteId: event.loteId },
            ),
        );
    }
    private async manejarFinalizacionTanda(
        lote: any,
        tanda: any,
        event: VentaAprobadaEvent,
    ): Promise<void> {
        if (tanda.stockActual !== 0 || tanda.estado !== 'EN_CASA') return;

        const esUltimaTanda = tanda.numero === lote.tandas.length;

        if (!esUltimaTanda) {
            await this.tandaRepository.finalizar(tanda.id);
            this.logger.log(`Tanda ${tanda.numero} finalizada (stock agotado)`);
            return;
        }

        this.logger.log(
            `Última tanda ${tanda.numero} con stock 0. Activando mini-cuadre.`,
        );
        this.eventBus.publish(
            new StockUltimaTandaAgotadoEvent(tanda.id, event.loteId),
        );
    }
}
