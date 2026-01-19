import { CommandHandler, ICommandHandler, ICommand } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import {
    IEquipamientoRepository,
    EQUIPAMIENTO_REPOSITORY,
} from '../../domain/equipamiento.repository.interface';
import {
    IUsuarioRepository,
    USUARIO_REPOSITORY,
} from '../../../usuarios/domain/usuario.repository.interface';
import {
    EquipamientoEntity,
    EQUIPAMIENTO_CONFIG,
} from '../../domain/equipamiento.entity';
import { DomainException } from '../../../../domain/exceptions/domain.exception';

// ========== SolicitarEquipamientoCommand ==========

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
  ) {}

  async execute(command: SolicitarEquipamientoCommand): Promise<any> {
    // Verificar que el vendedor existe y está activo
    const vendedor = await this.usuarioRepository.findById(command.vendedorId);
    if (!vendedor || vendedor.estado !== 'ACTIVO') {
      throw new DomainException('EQU_005', 'Vendedor no encontrado o no activo');
    }

    // Verificar que no tenga equipamiento existente
    const existente = await this.equipamientoRepository.findByVendedorId(command.vendedorId);
    if (existente && existente.estado !== 'DEVUELTO') {
      throw new DomainException('EQU_006', 'El vendedor ya tiene equipamiento activo');
    }

    // Calcular mensualidad según depósito
    const mensualidad = EquipamientoEntity.calcularMensualidad(command.tieneDeposito);

    // Crear equipamiento
    const equipamiento = await this.equipamientoRepository.create({
      vendedorId: command.vendedorId,
      tieneDeposito: command.tieneDeposito,
      depositoPagado: command.tieneDeposito ? EQUIPAMIENTO_CONFIG.DEPOSITO_INICIAL : undefined,
      mensualidadActual: mensualidad,
    });

    this.logger.log(
      `Equipamiento solicitado: ${equipamiento.id} - ` +
      `Vendedor: ${command.vendedorId} - ` +
      `Con depósito: ${command.tieneDeposito}`,
    );

    return equipamiento;
  }
}

// ========== ActivarEquipamientoCommand ==========

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
    this.logger.log(`Equipamiento activado: ${command.equipamientoId}`);

    return activado;
  }
}

// ========== PagarMensualidadCommand ==========

export class PagarMensualidadCommand implements ICommand {
  constructor(public readonly equipamientoId: string) {}
}

@CommandHandler(PagarMensualidadCommand)
export class PagarMensualidadHandler
  implements ICommandHandler<PagarMensualidadCommand>
{
  private readonly logger = new Logger(PagarMensualidadHandler.name);

  constructor(
    @Inject(EQUIPAMIENTO_REPOSITORY)
    private readonly equipamientoRepository: IEquipamientoRepository,
  ) {}

  async execute(command: PagarMensualidadCommand): Promise<any> {
    const equipamiento = await this.equipamientoRepository.findById(command.equipamientoId);
    if (!equipamiento) {
      throw new DomainException('EQU_007', 'Equipamiento no encontrado');
    }

    if (equipamiento.estado !== 'ACTIVO' && equipamiento.estado !== 'DANADO') {
      throw new DomainException('EQU_008', 'Solo se puede pagar mensualidad de equipamiento activo o dañado');
    }

    const actualizado = await this.equipamientoRepository.registrarPagoMensualidad(command.equipamientoId);
    this.logger.log(`Mensualidad pagada: ${command.equipamientoId}`);

    return actualizado;
  }
}

// ========== ReportarDanoCommand ==========

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

    const monto = command.tipoDano === 'NEVERA'
      ? EQUIPAMIENTO_CONFIG.COSTO_DANO_NEVERA
      : EQUIPAMIENTO_CONFIG.COSTO_DANO_PIJAMA;

    const danado = await this.equipamientoRepository.reportarDano(
      command.equipamientoId,
      command.tipoDano,
      monto,
    );
    this.logger.log(`Daño reportado: ${command.equipamientoId} - Tipo: ${command.tipoDano}`);

    return danado;
  }
}

// ========== ReportarPerdidaCommand ==========

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

    const perdido = await this.equipamientoRepository.reportarPerdida(
      command.equipamientoId,
      EQUIPAMIENTO_CONFIG.COSTO_PERDIDA_TOTAL,
    );
    this.logger.log(`Pérdida reportada: ${command.equipamientoId}`);

    return perdido;
  }
}

// ========== PagarDanoCommand ==========

export class PagarDanoCommand implements ICommand {
  constructor(public readonly equipamientoId: string) {}
}

@CommandHandler(PagarDanoCommand)
export class PagarDanoHandler implements ICommandHandler<PagarDanoCommand> {
  private readonly logger = new Logger(PagarDanoHandler.name);

  constructor(
    @Inject(EQUIPAMIENTO_REPOSITORY)
    private readonly equipamientoRepository: IEquipamientoRepository,
  ) {}

  async execute(command: PagarDanoCommand): Promise<any> {
    const equipamiento = await this.equipamientoRepository.findById(command.equipamientoId);
    if (!equipamiento) {
      throw new DomainException('EQU_007', 'Equipamiento no encontrado');
    }

    const deudaDano = new Decimal(equipamiento.deudaDano);
    if (deudaDano.lessThanOrEqualTo(0)) {
      throw new DomainException('EQU_009', 'No hay deuda de daño pendiente');
    }

    const actualizado = await this.equipamientoRepository.pagarDano(
      command.equipamientoId,
      deudaDano,
    );
    this.logger.log(`Daño pagado: ${command.equipamientoId}`);

    return actualizado;
  }
}

// ========== DevolverEquipamientoCommand ==========

export class DevolverEquipamientoCommand implements ICommand {
  constructor(public readonly equipamientoId: string) {}
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

    this.logger.log(`Equipamiento devuelto: ${command.equipamientoId}`);
    return devuelto;
  }
}

// Export handlers array
export const EquipamientoCommandHandlers = [
  SolicitarEquipamientoHandler,
  ActivarEquipamientoHandler,
  PagarMensualidadHandler,
  ReportarDanoHandler,
  ReportarPerdidaHandler,
  PagarDanoHandler,
  DevolverEquipamientoHandler,
];
