import { CommandHandler, ICommandHandler, ICommand } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import {
    IEquipamientoRepository,
    EQUIPAMIENTO_REPOSITORY,
} from '../../domain/equipamiento.repository.interface';
import {
    IUsuarioRepository,
    USUARIO_REPOSITORY,
} from '../../../usuarios/domain/usuario.repository.interface';
import { EquipamientoEntity } from '../../domain/equipamiento.entity';
import { EquipamientoConfigService } from '../../domain/equipamiento-config.service';
import { ActualizadorCuadresVendedorService } from '../../../cuadres/domain/actualizador-cuadres-vendedor.service';
import { DomainException } from '../../../../domain/exceptions/domain.exception';

// ========== SolicitarEquipamientoCommand ==========
// Ejecutado por: VENDEDOR

export class SolicitarEquipamientoCommand implements ICommand {
    constructor(
        public readonly vendedorId: string,
        public readonly tieneDeposito: boolean,
    ) {}
}

@CommandHandler(SolicitarEquipamientoCommand)
export class SolicitarEquipamientoHandler
    implements ICommandHandler<SolicitarEquipamientoCommand>
{
    private readonly logger = new Logger(SolicitarEquipamientoHandler.name);

    constructor(
        @Inject(EQUIPAMIENTO_REPOSITORY)
        private readonly equipamientoRepository: IEquipamientoRepository,
        @Inject(USUARIO_REPOSITORY)
        private readonly usuarioRepository: IUsuarioRepository,
        private readonly equipamientoConfig: EquipamientoConfigService,
    ) {}

    async execute(command: SolicitarEquipamientoCommand): Promise<any> {
        // Verificar que el vendedor existe y está activo
        const vendedor = await this.usuarioRepository.findById(command.vendedorId);
        if (vendedor?.estado !== 'ACTIVO') {
            throw new DomainException('EQU_005', 'Vendedor no encontrado o no activo');
        }

        // Verificar que no tenga equipamiento activo/solicitado
        const existente = await this.equipamientoRepository.findActivoByVendedorId(command.vendedorId);
        if (existente) {
            throw new DomainException(
                'EQU_006',
                'El vendedor ya tiene equipamiento activo o solicitado',
                { estadoActual: existente.estado },
            );
        }

        // Calcular mensualidad según depósito usando ConfigService
        const mensualidad = this.equipamientoConfig.calcularMensualidad(command.tieneDeposito);
        const deposito = command.tieneDeposito ? this.equipamientoConfig.deposito : undefined;

        // Crear equipamiento
        const equipamiento = await this.equipamientoRepository.create({
            vendedorId: command.vendedorId,
            tieneDeposito: command.tieneDeposito,
            depositoPagado: deposito,
            mensualidadActual: mensualidad,
        });

        this.logger.log(
            `Equipamiento solicitado: ${equipamiento.id} - ` +
            `Vendedor: ${command.vendedorId} - ` +
            `Con depósito: ${command.tieneDeposito} - ` +
            `Mensualidad: $${mensualidad.toFixed(0)}`,
        );

        return equipamiento;
    }
}

// ========== ActivarEquipamientoCommand ==========
// Ejecutado por: ADMIN
// Representa la entrega física del equipamiento al vendedor

export class ActivarEquipamientoCommand implements ICommand {
    constructor(
        public readonly equipamientoId: string,
        public readonly adminId: string,
    ) {}
}

@CommandHandler(ActivarEquipamientoCommand)
export class ActivarEquipamientoHandler
    implements ICommandHandler<ActivarEquipamientoCommand>
{
    private readonly logger = new Logger(ActivarEquipamientoHandler.name);

    constructor(
        @Inject(EQUIPAMIENTO_REPOSITORY)
        private readonly equipamientoRepository: IEquipamientoRepository,
    ) {}

    async execute(command: ActivarEquipamientoCommand): Promise<any> {
        const equipamiento = await this.equipamientoRepository.findById(command.equipamientoId);
        if (!equipamiento) {
            throw new DomainException('EQU_007', 'Equipamiento no encontrado');
        }

        const entity = new EquipamientoEntity({
            ...equipamiento,
            deudaDano: equipamiento.deudaDano,
            deudaPerdida: equipamiento.deudaPerdida,
        });
        entity.validarActivacion();

        const activado = await this.equipamientoRepository.activar(command.equipamientoId);

        this.logger.log(
            `Equipamiento activado: ${command.equipamientoId} - ` +
            `Admin: ${command.adminId} - ` +
            `Vendedor: ${equipamiento.vendedorId}`,
        );

        return activado;
    }
}

// ========== ReportarDanoCommand ==========
// Ejecutado por: ADMIN
// Solo aumenta la deuda, NO cambia el estado
// Actualiza cuadres del vendedor después de reportar

export class ReportarDanoCommand implements ICommand {
    constructor(
        public readonly equipamientoId: string,
        public readonly tipoDano: 'NEVERA' | 'PIJAMA',
        public readonly adminId: string,
    ) {}
}

@CommandHandler(ReportarDanoCommand)
export class ReportarDanoHandler implements ICommandHandler<ReportarDanoCommand> {
    private readonly logger = new Logger(ReportarDanoHandler.name);

    constructor(
        @Inject(EQUIPAMIENTO_REPOSITORY)
        private readonly equipamientoRepository: IEquipamientoRepository,
        private readonly equipamientoConfig: EquipamientoConfigService,
        private readonly actualizadorCuadres: ActualizadorCuadresVendedorService,
    ) {}

    async execute(command: ReportarDanoCommand): Promise<any> {
        const equipamiento = await this.equipamientoRepository.findById(command.equipamientoId);
        if (!equipamiento) {
            throw new DomainException('EQU_007', 'Equipamiento no encontrado');
        }

        const entity = new EquipamientoEntity({
            ...equipamiento,
            deudaDano: equipamiento.deudaDano,
            deudaPerdida: equipamiento.deudaPerdida,
        });
        entity.validarReporteDano();

        // Obtener costo del daño desde configuración
        const monto = this.equipamientoConfig.getCostoDano(command.tipoDano);

        const danado = await this.equipamientoRepository.reportarDano(
            command.equipamientoId,
            command.tipoDano,
            monto,
        );

        this.logger.log(
            `Daño reportado: ${command.equipamientoId} - ` +
            `Tipo: ${command.tipoDano} - ` +
            `Monto: $${monto.toFixed(0)} - ` +
            `Admin: ${command.adminId}`,
        );

        // Actualizar cuadres del vendedor para reflejar la nueva deuda
        try {
            await this.actualizadorCuadres.actualizarPorCambioDeudaEquipamiento(
                equipamiento.vendedorId,
                `Daño reportado: ${command.tipoDano} ($${monto.toFixed(0)})`,
            );
        } catch (error) {
            // Log del error pero no bloquear el reporte de daño
            this.logger.error(
                `Error actualizando cuadres después de reportar daño: ${error}`,
            );
        }

        return danado;
    }
}

// ========== ReportarPerdidaCommand ==========
// Ejecutado por: ADMIN
// Pérdida total del equipamiento (nevera + pijama)
// Actualiza cuadres del vendedor después de reportar

export class ReportarPerdidaCommand implements ICommand {
    constructor(
        public readonly equipamientoId: string,
        public readonly adminId: string,
    ) {}
}

@CommandHandler(ReportarPerdidaCommand)
export class ReportarPerdidaHandler implements ICommandHandler<ReportarPerdidaCommand> {
    private readonly logger = new Logger(ReportarPerdidaHandler.name);

    constructor(
        @Inject(EQUIPAMIENTO_REPOSITORY)
        private readonly equipamientoRepository: IEquipamientoRepository,
        private readonly equipamientoConfig: EquipamientoConfigService,
        private readonly actualizadorCuadres: ActualizadorCuadresVendedorService,
    ) {}

    async execute(command: ReportarPerdidaCommand): Promise<any> {
        const equipamiento = await this.equipamientoRepository.findById(command.equipamientoId);
        if (!equipamiento) {
            throw new DomainException('EQU_007', 'Equipamiento no encontrado');
        }

        const entity = new EquipamientoEntity({
            ...equipamiento,
            deudaDano: equipamiento.deudaDano,
            deudaPerdida: equipamiento.deudaPerdida,
        });
        entity.validarReportePerdida();

        // Costo total de pérdida desde configuración
        const monto = this.equipamientoConfig.costoPerdidaTotal;

        const perdido = await this.equipamientoRepository.reportarPerdida(
            command.equipamientoId,
            monto,
        );

        this.logger.log(
            `Pérdida reportada: ${command.equipamientoId} - ` +
            `Monto: $${monto.toFixed(0)} - ` +
            `Admin: ${command.adminId}`,
        );

        // Actualizar cuadres del vendedor para reflejar la nueva deuda
        try {
            await this.actualizadorCuadres.actualizarPorCambioDeudaEquipamiento(
                equipamiento.vendedorId,
                `Pérdida total reportada ($${monto.toFixed(0)})`,
            );
        } catch (error) {
            // Log del error pero no bloquear el reporte de pérdida
            this.logger.error(
                `Error actualizando cuadres después de reportar pérdida: ${error}`,
            );
        }

        return perdido;
    }
}

// ========== DevolverEquipamientoCommand ==========
// Ejecutado por: ADMIN
// Solo si no hay deudas pendientes

export class DevolverEquipamientoCommand implements ICommand {
    constructor(
        public readonly equipamientoId: string,
        public readonly adminId: string,
    ) {}
}

@CommandHandler(DevolverEquipamientoCommand)
export class DevolverEquipamientoHandler
    implements ICommandHandler<DevolverEquipamientoCommand>
{
    private readonly logger = new Logger(DevolverEquipamientoHandler.name);

    constructor(
        @Inject(EQUIPAMIENTO_REPOSITORY)
        private readonly equipamientoRepository: IEquipamientoRepository,
    ) {}

    async execute(command: DevolverEquipamientoCommand): Promise<any> {
        const equipamiento = await this.equipamientoRepository.findById(command.equipamientoId);
        if (!equipamiento) {
            throw new DomainException('EQU_007', 'Equipamiento no encontrado');
        }

        const entity = new EquipamientoEntity({
            ...equipamiento,
            deudaDano: equipamiento.deudaDano,
            deudaPerdida: equipamiento.deudaPerdida,
        });
        entity.validarDevolucion();

        // Devolver equipamiento
        let devuelto = await this.equipamientoRepository.devolver(command.equipamientoId);

        // Si tiene depósito, devolverlo
        if (equipamiento.tieneDeposito && !equipamiento.depositoDevuelto) {
            devuelto = await this.equipamientoRepository.devolverDeposito(command.equipamientoId);
            this.logger.log(`Depósito devuelto: ${command.equipamientoId}`);
        }

        this.logger.log(
            `Equipamiento devuelto: ${command.equipamientoId} - ` +
            `Admin: ${command.adminId}`,
        );

        return devuelto;
    }
}

// Export handlers array
export const EquipamientoCommandHandlers = [
    SolicitarEquipamientoHandler,
    ActivarEquipamientoHandler,
    ReportarDanoHandler,
    ReportarPerdidaHandler,
    DevolverEquipamientoHandler,
];