import { CommandHandler, ICommandHandler, ICommand } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import {
  IFondoRecompensasRepository,
  FONDO_RECOMPENSAS_REPOSITORY,
  FondoRecompensasService,
} from '../../domain';

// ========== RegistrarEntradaFondoCommand ==========

export class RegistrarEntradaFondoCommand implements ICommand {
  constructor(
    public readonly monto: Decimal,
    public readonly concepto: string,
    public readonly loteId?: string,
  ) {}
}

@CommandHandler(RegistrarEntradaFondoCommand)
export class RegistrarEntradaFondoHandler
  implements ICommandHandler<RegistrarEntradaFondoCommand>
{
  private readonly logger = new Logger(RegistrarEntradaFondoHandler.name);

  constructor(
    @Inject(FONDO_RECOMPENSAS_REPOSITORY)
    private readonly fondoRepository: IFondoRecompensasRepository,
  ) {}

  async execute(command: RegistrarEntradaFondoCommand): Promise<any> {
    const movimiento = await this.fondoRepository.registrarEntrada({
      tipo: 'ENTRADA',
      monto: command.monto,
      concepto: command.concepto,
      loteId: command.loteId,
    });

    this.logger.log(
      `Entrada registrada: $${command.monto.toFixed(2)} - ${command.concepto}`,
    );

    return movimiento;
  }
}

// ========== RegistrarSalidaFondoCommand ==========

export class RegistrarSalidaFondoCommand implements ICommand {
  constructor(
    public readonly monto: Decimal,
    public readonly concepto: string,
    public readonly adminId: string,
  ) {}
}

@CommandHandler(RegistrarSalidaFondoCommand)
export class RegistrarSalidaFondoHandler
  implements ICommandHandler<RegistrarSalidaFondoCommand>
{
  private readonly logger = new Logger(RegistrarSalidaFondoHandler.name);

  constructor(
    @Inject(FONDO_RECOMPENSAS_REPOSITORY)
    private readonly fondoRepository: IFondoRecompensasRepository,
    private readonly fondoService: FondoRecompensasService,
  ) {}

  async execute(command: RegistrarSalidaFondoCommand): Promise<any> {
    // Obtener saldo actual
    const saldoActual = await this.fondoRepository.obtenerSaldo();

    // Validar que no quede en negativo
    this.fondoService.validarSalida(saldoActual, command.monto);

    // Registrar salida
    const movimiento = await this.fondoRepository.registrarSalida({
      tipo: 'SALIDA',
      monto: command.monto,
      concepto: command.concepto,
    });

    this.logger.log(
      `Salida registrada: $${command.monto.toFixed(2)} - ${command.concepto}`,
    );

    return movimiento;
  }
}

// Export handlers array
export const FondoRecompensasCommandHandlers = [
  RegistrarEntradaFondoHandler,
  RegistrarSalidaFondoHandler,
];
