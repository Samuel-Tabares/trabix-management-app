import { CommandHandler, ICommandHandler, ICommand, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import {
    ICuadreRepository,
    CUADRE_REPOSITORY,
} from '../../domain/cuadre.repository.interface';
import {
    IEquipamientoRepository,
    EQUIPAMIENTO_REPOSITORY,
} from '../../../equipamiento/domain/equipamiento.repository.interface';
import { CuadreEntity } from '../../domain/cuadre.entity';
import { DomainException } from '../../../../domain/exceptions/domain.exception';
import { CuadreExitosoEvent } from '../events/cuadre-exitoso.event';

/**
 * Command para confirmar un cuadre como exitoso
 */
export class ConfirmarCuadreCommand implements ICommand {
    constructor(
        public readonly cuadreId: string,
        public readonly montoRecibido: number,
        public readonly adminId: string,
    ) {}
}

/**
 * Handler del comando ConfirmarCuadre
 * Según sección 17.6 del documento
 *
 * Validaciones:
 * - Cuadre existe y está PENDIENTE
 * - monto_recibido >= monto_esperado
 * - Admin confirma
 *
 * Al confirmar exitoso:
 * - Actualiza estado a EXITOSO
 * - Reduce deudas de equipamiento del vendedor
 * - Registra pago de mensualidad
 * - Publica CuadreExitosoEvent (libera siguiente tanda)
 *
 * INTEGRACIÓN EQUIPAMIENTO:
 * - Al confirmar, se reducen las deudas de daño/pérdida
 * - Se registra el pago de mensualidad
 */
@CommandHandler(ConfirmarCuadreCommand)
export class ConfirmarCuadreHandler
    implements ICommandHandler<ConfirmarCuadreCommand>
{
    private readonly logger = new Logger(ConfirmarCuadreHandler.name);

    constructor(
        @Inject(CUADRE_REPOSITORY)
        private readonly cuadreRepository: ICuadreRepository,
        @Inject(EQUIPAMIENTO_REPOSITORY)
        private readonly equipamientoRepository: IEquipamientoRepository,
        private readonly eventBus: EventBus,
    ) {}

    async execute(command: ConfirmarCuadreCommand): Promise<any> {
        const { cuadreId, montoRecibido, adminId } = command;

        // Buscar el cuadre
        const cuadre = await this.cuadreRepository.findById(cuadreId);
        if (!cuadre) {
            throw new DomainException('CUA_001', 'Cuadre no encontrado', { cuadreId });
        }

        // Crear entidad de dominio para validaciones
        const cuadreEntity = new CuadreEntity({
            ...cuadre,
            montoEsperado: cuadre.montoEsperado,
            montoRecibido: cuadre.montoRecibido,
            montoFaltante: cuadre.montoFaltante,
            montoCubiertoPorMayor: cuadre.montoCubiertoPorMayor,
        });

        // Validar que se puede confirmar
        const montoRecibidoDecimal = new Decimal(montoRecibido);
        cuadreEntity.validarConfirmacion(montoRecibidoDecimal);

        const vendedorId = cuadre.tanda.lote?.vendedorId;
        if (!vendedorId) {
            throw new DomainException('CUA_004', 'Vendedor no encontrado en el cuadre');
        }

        // Procesar deudas de equipamiento ANTES de confirmar el cuadre
        await this.procesarDeudasEquipamiento(vendedorId);

        // Confirmar como exitoso
        const cuadreActualizado = await this.cuadreRepository.confirmarExitoso(
            cuadreId,
            montoRecibidoDecimal,
        );

        this.logger.log(
            `Cuadre confirmado exitoso: ${cuadreId} - Monto: $${montoRecibido} - Admin: ${adminId}`,
        );

        // Publicar evento CuadreExitosoEvent
        this.eventBus.publish(
            new CuadreExitosoEvent(
                cuadreId,
                cuadre.tandaId,
                cuadre.tanda.loteId,
                vendedorId,
                montoRecibidoDecimal,
                cuadre.tanda.numero,
            ),
        );

        return cuadreActualizado;
    }

    /**
     * Procesa las deudas de equipamiento del vendedor
     * - Reduce deuda de daño a 0
     * - Reduce deuda de pérdida a 0
     * - Registra pago de mensualidad
     */
    private async procesarDeudasEquipamiento(vendedorId: string): Promise<void> {
        try {
            // Buscar equipamiento activo del vendedor
            const equipamiento = await this.equipamientoRepository.findActivoByVendedorId(vendedorId);

            if (!equipamiento) {
                this.logger.debug(`Vendedor ${vendedorId} no tiene equipamiento activo`);
                return;
            }

            const deudaDano = new Decimal(equipamiento.deudaDano || 0);
            const deudaPerdida = new Decimal(equipamiento.deudaPerdida || 0);

            // Reducir deuda de daño si existe
            if (deudaDano.greaterThan(0)) {
                await this.equipamientoRepository.reducirDeudaDano(
                    equipamiento.id,
                    deudaDano,
                );
                this.logger.log(
                    `Deuda de daño reducida: $${deudaDano.toFixed(2)} - Equipamiento: ${equipamiento.id}`,
                );
            }

            // Reducir deuda de pérdida si existe
            if (deudaPerdida.greaterThan(0)) {
                await this.equipamientoRepository.reducirDeudaPerdida(
                    equipamiento.id,
                    deudaPerdida,
                );
                this.logger.log(
                    `Deuda de pérdida reducida: $${deudaPerdida.toFixed(2)} - Equipamiento: ${equipamiento.id}`,
                );
            }

            // Registrar pago de mensualidad (actualiza la fecha)
            // Solo si el equipamiento está ACTIVO (no PERDIDO)
            if (equipamiento.estado === 'ACTIVO') {
                await this.equipamientoRepository.registrarPagoMensualidad(equipamiento.id);
                this.logger.log(
                    `Mensualidad registrada - Equipamiento: ${equipamiento.id}`,
                );
            }
        } catch (error) {
            // Log del error pero no bloquear el cuadre
            this.logger.error(
                `Error procesando deudas de equipamiento para vendedor ${vendedorId}:`,
                error,
            );
            // No lanzar el error para que el cuadre pueda continuar
        }
    }
}