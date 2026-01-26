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
import { DomainException } from '../../../../domain/exceptions/domain.exception';
import { CuadreMayorExitosoEvent } from '../events/cuadre-mayor-exitoso.event';
import { StockUltimaTandaAgotadoEvent } from '../../../mini-cuadres/application/events';
import { RegistrarEntradaFondoCommand } from '../../../fondo-recompensas/application/commands';
import { FONDO_CONFIG } from '../../../fondo-recompensas/domain';

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
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
  ) {}

    async execute(command: ConfirmarCuadreMayorCommand): Promise<any> {
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

        const tandasAfectadas = cuadreMayor.tandasAfectadas as any[];

        // Helper: procesar tanda agotada
        const procesarTandaAgotada = async (tandaId: string, loteId: string, numeroTanda: number) => {
            const tandaActualizada = await this.tandaRepository.findById(tandaId);
            if (tandaActualizada?.estado !== 'EN_CASA' || tandaActualizada.stockActual > 0) return;

            const lote = await this.loteRepository.findById(loteId);
            if (!lote) return;

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
        for (const { tandaId, cantidadStockConsumido, numeroTanda, loteId } of tandasAfectadas) {
            await this.tandaRepository.consumirStock(tandaId, cantidadStockConsumido);
            this.logger.log(`Stock consumido: Tanda ${tandaId} - ${cantidadStockConsumido} unidades`);
            await procesarTandaAgotada(tandaId, loteId, numeroTanda);
        }

        // Helper: cerrar cuadres cubiertos
        const cuadresCerradosIds: string[] = [];
        const cerrarCuadresDeLote = async (loteId: string) => {
            const cuadresLote = await this.cuadreRepository.findByLoteId(loteId);
            for (const cuadre of cuadresLote) {
                if (cuadre.estado === 'INACTIVO' || cuadre.estado === 'PENDIENTE') {
                    await this.cuadreRepository.cerrarPorMayor(cuadre.id, cuadreMayorId, cuadreMayor.montoTotalAdmin);
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

                const aporteFondo = FONDO_CONFIG.APORTE_POR_TRABIX_DEFAULT.times(loteForzado.cantidadTrabix);
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
        for (const loteId of cuadreMayor.lotesInvolucradosIds) {
            await this.loteRepository.actualizarRecaudado(loteId, cuadreMayor.ingresoBruto);
            await this.loteRepository.actualizarTransferido(loteId, cuadreMayor.montoTotalAdmin);
        }

        // 5. Confirmar cuadre al mayor
        const cuadreConfirmado = await this.cuadreMayorRepository.confirmarExitoso(cuadreMayorId, cuadresCerradosIds);

        this.logger.log(
            `Cuadre al mayor confirmado: ${cuadreMayorId} - Admin: $${Number.parseFloat(
                cuadreMayor.montoTotalAdmin as any,
            ).toFixed(2)} - Cuadres cerrados: ${cuadresCerradosIds.length}`,
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

}
