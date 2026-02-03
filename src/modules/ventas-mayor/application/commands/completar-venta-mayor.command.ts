import { CommandHandler, ICommandHandler, ICommand } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import {
    IVentaMayorRepository,
    VENTA_MAYOR_REPOSITORY,
} from '../../domain/venta-mayor.repository.interface';
import {
    ITandaRepository,
    TANDA_REPOSITORY,
} from '../../../lotes/domain/tanda.repository.interface';
import { VentaMayorEntity } from '../../domain/venta-mayor.entity';
import { DomainException } from '../../../../domain/exceptions/domain.exception';

/**
 * Command para completar una venta al mayor
 */
export class CompletarVentaMayorCommand implements ICommand {
    constructor(
        public readonly ventaMayorId: string,
        public readonly adminId: string,
    ) {}
}

/**
 * Handler del comando CompletarVentaMayor
 *
 * Al completar:
 * 1. Valida que la venta esté PENDIENTE
 * 2. Descuenta el stock de cada tanda según las fuentes de stock
 * 3. Marca la venta como COMPLETADA
 */
@CommandHandler(CompletarVentaMayorCommand)
export class CompletarVentaMayorHandler
    implements ICommandHandler<CompletarVentaMayorCommand>
{
    private readonly logger = new Logger(CompletarVentaMayorHandler.name);

    constructor(
        @Inject(VENTA_MAYOR_REPOSITORY)
        private readonly ventaMayorRepository: IVentaMayorRepository,
        @Inject(TANDA_REPOSITORY)
        private readonly tandaRepository: ITandaRepository,
    ) {}

    async execute(command: CompletarVentaMayorCommand): Promise<any> {
        const { ventaMayorId, adminId } = command;

        // Buscar la venta con sus fuentes de stock
        const venta = await this.ventaMayorRepository.findById(ventaMayorId);
        if (!venta) {
            throw new DomainException('VTM_003', 'Venta al mayor no encontrada', {
                ventaMayorId,
            });
        }

        // Validar que se puede completar
        const ventaEntity = new VentaMayorEntity({
            id: venta.id,
            vendedorId: venta.vendedorId,
            cantidadUnidades: venta.cantidadUnidades,
            precioUnidad: venta.precioUnidad,
            ingresoBruto: venta.ingresoBruto,
            conLicor: venta.conLicor,
            modalidad: venta.modalidad,
            estado: venta.estado,
            fuentesStock: venta.fuentesStock?.map((f) => ({
                tandaId: f.tandaId,
                cantidadConsumida: f.cantidadConsumida,
                tipoStock: f.tipoStock as any,
            })) || [],
            lotesInvolucradosIds: venta.lotesInvolucrados?.map((l) => l.loteId) || [],
            loteForzadoId: null,
            fechaRegistro: venta.fechaRegistro,
            fechaCompletada: venta.fechaCompletada,
        });

        ventaEntity.validarCompletar();

        // Descontar stock de cada tanda según las fuentes de stock
        if (venta.fuentesStock && venta.fuentesStock.length > 0) {
            for (const fuente of venta.fuentesStock) {
                // Verificar que la tanda existe y tiene stock suficiente
                const tanda = await this.tandaRepository.findById(fuente.tandaId);
                if (!tanda) {
                    throw new DomainException('TND_001', 'Tanda no encontrada', {
                        tandaId: fuente.tandaId,
                    });
                }

                if (tanda.stockActual < fuente.cantidadConsumida) {
                    throw new DomainException('VTM_002', 'Stock insuficiente en tanda', {
                        tandaId: fuente.tandaId,
                        stockDisponible: tanda.stockActual,
                        cantidadRequerida: fuente.cantidadConsumida,
                    });
                }

                // Descontar stock
                await this.tandaRepository.consumirStock(
                    fuente.tandaId,
                    fuente.cantidadConsumida,
                );

                this.logger.log(
                    `Stock descontado: Tanda ${fuente.tandaId} - ${fuente.cantidadConsumida} unidades`,
                );
            }
        }

        // Completar la venta
        const ventaCompletada = await this.ventaMayorRepository.completar(ventaMayorId);

        this.logger.log(
            `Venta al mayor completada: ${ventaMayorId} - ` +
            `${venta.cantidadUnidades} unidades - Admin: ${adminId}`,
        );

        return ventaCompletada;
    }
}