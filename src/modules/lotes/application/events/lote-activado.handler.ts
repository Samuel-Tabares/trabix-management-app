import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { ConceptoCuadre } from '@prisma/client';
import { LoteActivadoEvent } from './lote-activado.event';
import { CalculadoraInversionService } from '../../domain/calculadora-inversion.service';
import {
    ICuadreRepository,
    CUADRE_REPOSITORY,
} from '../../../cuadres/domain/cuadre.repository.interface';
import {
    ILoteRepository,
    LOTE_REPOSITORY,
} from '../../../lotes/domain/lote.repository.interface';
import {
    IMiniCuadreRepository,
    MINI_CUADRE_REPOSITORY,
} from '../../../mini-cuadres/domain/mini-cuadre.repository.interface';
import { RegistrarEntradaFondoCommand } from '../../../fondo-recompensas/application/commands';
import { EnviarNotificacionCommand } from '../../../notificaciones/application/commands';

/**
 * Handler del evento LoteActivado
 * Según sección 23 del documento
 * 
 * Acciones:
 * 1. Liberar Tanda 1 ✓ (ya se hace en el repositorio al activar)
 * 2. Crear cuadres para cada tanda
 * 3. Crear mini-cuadre para última tanda
 * 4. Registrar entrada en fondo de recompensas
 * 5. Enviar notificación al vendedor
 */
@EventsHandler(LoteActivadoEvent)
export class LoteActivadoHandler implements IEventHandler<LoteActivadoEvent> {
    private readonly logger = new Logger(LoteActivadoHandler.name);

    constructor(
        private readonly calculadoraInversion: CalculadoraInversionService,
        @Inject(CUADRE_REPOSITORY)
        private readonly cuadreRepository: ICuadreRepository,
        @Inject(LOTE_REPOSITORY)
        private readonly loteRepository: ILoteRepository,
        @Inject(MINI_CUADRE_REPOSITORY)
        private readonly miniCuadreRepository: IMiniCuadreRepository,
        private readonly commandBus: CommandBus,
    ) {
    }

    async handle(event: LoteActivadoEvent): Promise<void> {
        this.logger.log(
            `Procesando LoteActivadoEvent: Lote ${event.loteId}, ` +
            `Vendedor ${event.vendedorId}, ${event.cantidadTrabix} TRABIX`,
        );

        try {
            // Obtener lote con tandas
            const lote = await this.loteRepository.findById(event.loteId);
            if (!lote) {
                throw new Error(`Lote no encontrado: ${event.loteId}`);
            }

            // Calcular aporte al fondo de recompensas
            const aporteFondo = this.calculadoraInversion.calcularAporteFondo(
                event.cantidadTrabix,
            );

            this.logger.log(
                `Lote ${event.loteId}: Aporte a fondo de recompensas = $${aporteFondo.toFixed(2)}`,
            );

            // Crear cuadres para cada tanda según sección 8.9
            const numeroTandas = lote.tandas.length;
            const inversionAdmin = new Decimal(lote.inversionAdmin);

            for (const tanda of lote.tandas) {
                const concepto = this.determinarConceptoCuadre(tanda.numero, numeroTandas);
                const montoEsperado = this.calcularMontoEsperadoInicial(
                    numeroTandas,
                    inversionAdmin,
                );

                await this.cuadreRepository.create({
                    tandaId: tanda.id,
                    concepto,
                    montoEsperado,
                });

                this.logger.log(
                    `Cuadre creado para tanda ${tanda.numero}: concepto=${concepto}, monto=$${montoEsperado.toFixed(2)}`,
                );
            }

            // Crear mini-cuadre para última tanda
            const ultimaTanda = lote.tandas.reduce((prev, curr) =>
                prev.numero > curr.numero ? prev : curr
            );

            await this.miniCuadreRepository.create({
                loteId: event.loteId,
                tandaId: ultimaTanda.id,
            });

            this.logger.log(
                `Mini-cuadre creado para lote ${event.loteId}, última tanda ${ultimaTanda.id}`,
            );

            // Registrar entrada en fondo de recompensas (sección 12)
            // Se alimenta automáticamente al activar lote: $200 por TRABIX
            await this.commandBus.execute(
                new RegistrarEntradaFondoCommand(
                    aporteFondo,
                    `Aporte por activación de lote ${event.loteId}`,
                    event.loteId,
                ),
            );
            this.logger.log(
                `Entrada registrada en fondo de recompensas: $${aporteFondo.toFixed(2)}`,
            );

            // Enviar notificación al vendedor
            await this.commandBus.execute(
                new EnviarNotificacionCommand(
                    event.vendedorId,
                    'TANDA_LIBERADA',
                    {
                        loteId: event.loteId,
                        cantidadTrabix: event.cantidadTrabix,
                        numeroTanda: 1,
                        cantidad: lote.tandas.find((t) => t.numero === 1)?.stockInicial || 0,
                    },
                ),
            );

            this.logger.log(`LoteActivadoEvent procesado exitosamente: ${event.loteId}`);
        } catch (error) {
            this.logger.error(
                `Error procesando LoteActivadoEvent: ${event.loteId}`,
                error,
            );
            // Los eventos deben ser idempotentes y se reintentan
            throw error;
        }
    }

    /**
     * Determina el concepto del cuadre según número de tanda y total de tandas
     * Según sección 8.9 del documento
     */
    private determinarConceptoCuadre(
        numeroTanda: number,
        totalTandas: number,
    ): ConceptoCuadre {
        if (totalTandas === 3) {
            // Lote 3 tandas: T1=INVERSION_ADMIN, T2=GANANCIAS, T3=GANANCIAS
            return numeroTanda === 1 ? 'INVERSION_ADMIN' : 'GANANCIAS';
        } else {
            // Lote 2 tandas: T1=MIXTO, T2=GANANCIAS
            return numeroTanda === 1 ? 'MIXTO' : 'GANANCIAS';
        }
    }

    /**
     * Calcula el monto esperado inicial del cuadre
     * Según sección 16.7 del documento
     *
     * Para T1: inversión_admin (o MIXTO si son 2 tandas)
     * Para T2/T3: ganancias (se actualizará conforme ventas)
     */
    private calcularMontoEsperadoInicial(
        numeroTanda: number,
        inversionAdmin: Decimal,
    ): Decimal {
        // Tanda 1: monto esperado = inversión_admin
        if (numeroTanda === 1) {
            return inversionAdmin;
        }

        // Tanda 2 o 3: ganancias inicialmente 0
        // Lote de 3 tandas: T2 y T3 → ganancias iniciales
        // Lote de 2 tandas: T2 → ganancias iniciales
        return new Decimal(0);
    }
}
