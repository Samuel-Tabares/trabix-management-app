import { CommandHandler, ICommandHandler, ICommand, EventBus, CommandBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import {
    ICuadreMayorRepository,
    CUADRE_MAYOR_REPOSITORY,
} from '../../domain/cuadre-mayor.repository.interface';
import {
    ICuadreRepository,
    CUADRE_REPOSITORY,
} from '../../../cuadres/domain/cuadre.repository.interface';
import {
    ILoteRepository,
    LOTE_REPOSITORY,
} from '../../../lotes/domain/lote.repository.interface';
import {
    ITandaRepository,
    TANDA_REPOSITORY,
} from '../../../lotes/domain/tanda.repository.interface';
import { CalculadoraInversionService } from '../../../lotes/domain/calculadora-inversion.service';
import { DomainException } from '../../../../domain/exceptions/domain.exception';
import { CuadreMayorExitosoEvent } from '../events/cuadre-mayor-exitoso.event';
import { StockUltimaTandaAgotadoEvent } from '../../../mini-cuadres/application/events';
import { RegistrarEntradaFondoCommand } from '../../../fondo-recompensas/application/commands';
import { TandaAfectada, parseDecimalValue } from '../../domain/cuadre-mayor.entity';

/**
 * Command para confirmar un cuadre al mayor
 */
export class ConfirmarCuadreMayorCommand implements ICommand {
    constructor(
        public readonly cuadreMayorId: string,
        public readonly adminId: string,
    ) {}
}

/**
 * Handler del comando ConfirmarCuadreMayor
 * Según sección 8.10 del documento
 *
 * Pasos:
 * 1. Validar que el cuadre está PENDIENTE
 * 2. Consumir stock de las tandas afectadas
 * 3. Cerrar cuadres normales cubiertos
 * 4. Si hay lote forzado: activar y finalizar inmediatamente
 * 5. Actualizar dinero recaudado y transferido de lotes
 * 6. Marcar cuadre como EXITOSO
 */
@CommandHandler(ConfirmarCuadreMayorCommand)
export class ConfirmarCuadreMayorHandler
    implements ICommandHandler<ConfirmarCuadreMayorCommand>
{
    private readonly logger = new Logger(ConfirmarCuadreMayorHandler.name);

    constructor(
        @Inject(CUADRE_MAYOR_REPOSITORY)
        private readonly cuadreMayorRepository: ICuadreMayorRepository,
        @Inject(CUADRE_REPOSITORY)
        private readonly cuadreRepository: ICuadreRepository,
        @Inject(LOTE_REPOSITORY)
        private readonly loteRepository: ILoteRepository,
        @Inject(TANDA_REPOSITORY)
        private readonly tandaRepository: ITandaRepository,
        private readonly calculadoraInversion: CalculadoraInversionService,
        private readonly eventBus: EventBus,
        private readonly commandBus: CommandBus,
    ) {}

    async execute(command: ConfirmarCuadreMayorCommand): Promise<unknown> {
        const { cuadreMayorId } = command;

        // Buscar el cuadre al mayor
        const cuadreMayor = await this.cuadreMayorRepository.findById(cuadreMayorId);
        if (!cuadreMayor) {
            throw new DomainException('CMA_002', 'Cuadre al mayor no encontrado', { cuadreMayorId });
        }

        if (cuadreMayor.estado !== 'PENDIENTE') {
            throw new DomainException(
                'CMA_001',
                'Solo se pueden confirmar cuadres en estado PENDIENTE',
                { estadoActual: cuadreMayor.estado },
            );
        }

        // Parsear tandas afectadas con tipo seguro
        const tandasAfectadas = this.parseTandasAfectadas(cuadreMayor.tandasAfectadas);

        // Helper: procesar tanda agotada
        const procesarTandaAgotada = async (
            tandaId: string,
            loteId: string,
            numeroTanda: number,
        ): Promise<void> => {
            const tandaActualizada = await this.tandaRepository.findById(tandaId);
            if (tandaActualizada?.estado !== 'EN_CASA' || tandaActualizada.stockActual > 0) {
                return;
            }

            const lote = await this.loteRepository.findById(loteId);
            if (!lote) {
                return;
            }

            const esUltimaTanda = numeroTanda === lote.tandas.length;

            if (esUltimaTanda) {
                this.logger.log(`Última tanda ${numeroTanda} con stock 0. Activando mini-cuadre.`);
                this.eventBus.publish(new StockUltimaTandaAgotadoEvent(tandaId, loteId));
            } else {
                await this.tandaRepository.finalizar(tandaId);
                this.logger.log(`Tanda ${tandaId} finalizada por stock agotado`);
            }
        };

        // 1. Consumir stock de tandas afectadas
        for (const tanda of tandasAfectadas) {
            await this.tandaRepository.consumirStock(tanda.tandaId, tanda.cantidadStockConsumido);
            this.logger.log(`Stock consumido: Tanda ${tanda.tandaId} - ${tanda.cantidadStockConsumido} unidades`);
            await procesarTandaAgotada(tanda.tandaId, tanda.loteId, tanda.numeroTanda);
        }

        // Helper: cerrar cuadres cubiertos
        const cuadresCerradosIds: string[] = [];
        const cerrarCuadresDeLote = async (loteId: string): Promise<void> => {
            const cuadresLote = await this.cuadreRepository.findByLoteId(loteId);
            for (const cuadre of cuadresLote) {
                if (cuadre.estado === 'INACTIVO' || cuadre.estado === 'PENDIENTE') {
                    const montoTotalAdmin = parseDecimalValue(cuadreMayor.montoTotalAdmin);
                    await this.cuadreRepository.cerrarPorMayor(cuadre.id, cuadreMayorId, montoTotalAdmin);
                    cuadresCerradosIds.push(cuadre.id);
                    this.logger.log(`Cuadre cerrado por mayor: ${cuadre.id}`);
                }
            }
        };

        // 2. Cerrar cuadres normales cubiertos
        for (const loteId of cuadreMayor.lotesInvolucradosIds) {
            await cerrarCuadresDeLote(loteId);
        }

        // 3. Procesar lote forzado si existe
        if (cuadreMayor.loteForzadoId) {
            const loteForzadoId = cuadreMayor.loteForzadoId;
            await this.loteRepository.activar(loteForzadoId);
            const loteForzado = await this.loteRepository.findById(loteForzadoId);

            if (loteForzado) {
                for (const tanda of loteForzado.tandas) {
                    await this.tandaRepository.finalizar(tanda.id);
                }
                await this.loteRepository.finalizar(loteForzadoId);

                // Usar CalculadoraInversionService para calcular el aporte al fondo
                const aporteFondo = this.calculadoraInversion.calcularAporteFondo(loteForzado.cantidadTrabix);
                await this.commandBus.execute(
                    new RegistrarEntradaFondoCommand(
                        aporteFondo,
                        `Aporte por lote forzado ${loteForzado.id} (cuadre al mayor ${cuadreMayorId})`,
                        loteForzado.id,
                    ),
                );
                this.logger.log(`Entrada registrada en fondo de recompensas por lote forzado: $${aporteFondo.toFixed(2)}`);
            }
            this.logger.log(`Lote forzado finalizado: ${loteForzadoId}`);
        }

        // 4. Actualizar dinero recaudado y transferido de lotes involucrados
        const ingresoBruto = parseDecimalValue(cuadreMayor.ingresoBruto);
        const montoTotalAdmin = parseDecimalValue(cuadreMayor.montoTotalAdmin);

        for (const loteId of cuadreMayor.lotesInvolucradosIds) {
            await this.loteRepository.actualizarRecaudado(loteId, ingresoBruto);
            await this.loteRepository.actualizarTransferido(loteId, montoTotalAdmin);
        }

        // 5. Confirmar cuadre al mayor
        const cuadreConfirmado = await this.cuadreMayorRepository.confirmarExitoso(
            cuadreMayorId,
            cuadresCerradosIds,
        );

        this.logger.log(
            `Cuadre al mayor confirmado: ${cuadreMayorId} - Admin: $${montoTotalAdmin.toFixed(2)} - Cuadres cerrados: ${cuadresCerradosIds.length}`,
        );

        this.eventBus.publish(
            new CuadreMayorExitosoEvent(
                cuadreMayorId,
                cuadreMayor.vendedorId,
                cuadreMayor.lotesInvolucradosIds,
                cuadresCerradosIds,
                cuadreMayor.loteForzadoId,
            ),
        );

        return cuadreConfirmado;
    }

    /**
     * Parsea las tandas afectadas desde el JSON almacenado
     */
    private parseTandasAfectadas(data: unknown): TandaAfectada[] {
        if (!Array.isArray(data)) {
            return [];
        }

        return data.map((item: Record<string, unknown>) => ({
            tandaId: String(item.tandaId ?? ''),
            cantidadStockConsumido: Number(item.cantidadStockConsumido ?? 0),
            numeroTanda: Number(item.numeroTanda ?? 0),
            loteId: String(item.loteId ?? ''),
        }));
    }
}