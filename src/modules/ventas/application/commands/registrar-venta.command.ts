import { CommandHandler, ICommandHandler, ICommand } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import {
    IVentaRepository,
    VENTA_REPOSITORY,
    VentaConDetalles,
} from '../../domain/venta.repository.interface';
import {
    ITandaRepository,
    TANDA_REPOSITORY,
} from '../../../lotes-module-corregido/domain/tanda.repository.interface';
import { VendedorPuedeVenderSpecification } from '../../domain/vendedor-puede-vender.specification';
import { RegaloPermitidoSpecification } from '../../domain/regalo-permitido.specification';
import { PRECIOS_VENTA, TRABIX_POR_TIPO } from '../../domain/venta.entity';
import { CreateVentaDto } from '../dto';
import { TipoVenta } from '@prisma/client';

/**
 * Command para registrar una venta
 */
export class RegistrarVentaCommand implements ICommand {
  constructor(
    public readonly vendedorId: string,
    public readonly data: CreateVentaDto,
  ) {}
}

/**
 * Handler del comando RegistrarVenta
 * Según sección 6 del documento
 * 
 * Flujo:
 * 1. Vendedor registra venta colectiva
 * 2. Venta queda en estado PENDIENTE
 * 3. Stock se reduce temporalmente
 * 
 * Lógica de consumo de stock:
 * - Las ventas consumen siempre el lote activo más antiguo
 * - Consume de la tanda EN_CASA actual
 */
@CommandHandler(RegistrarVentaCommand)
export class RegistrarVentaHandler
  implements ICommandHandler<RegistrarVentaCommand, VentaConDetalles>
{
  private readonly logger = new Logger(RegistrarVentaHandler.name);

  constructor(
    @Inject(VENTA_REPOSITORY)
    private readonly ventaRepository: IVentaRepository,
    @Inject(TANDA_REPOSITORY)
    private readonly tandaRepository: ITandaRepository,
    private readonly vendedorPuedeVender: VendedorPuedeVenderSpecification,
    private readonly regaloPermitido: RegaloPermitidoSpecification,
  ) {}

  async execute(command: RegistrarVentaCommand): Promise<VentaConDetalles> {
    const { vendedorId, data } = command;

    // Calcular cantidad total de TRABIX
    const cantidadTrabix = this.calcularCantidadTrabix(data.detalles);

    // 1. Verificar que el vendedor puede vender (todas las validaciones)
    const { lote, tanda } = await this.vendedorPuedeVender.verificar(
      vendedorId,
      cantidadTrabix,
    );

    // 2. Calcular cantidad de regalos y verificar límite
    const cantidadRegalos = data.detalles
      .filter(d => d.tipo === 'REGALO')
      .reduce((sum, d) => sum + d.cantidad, 0);

    if (cantidadRegalos > 0) {
      await this.regaloPermitido.verificar(
        lote.id,
        lote.cantidadTrabix,
        cantidadRegalos,
      );
    }

    // 3. Calcular monto total y detalles
    const detallesConPrecios = data.detalles.map(detalle => {
      const precioUnitario = new Decimal(PRECIOS_VENTA[detalle.tipo]);
      const subtotal = precioUnitario.times(detalle.cantidad);
      return {
        tipo: detalle.tipo,
        cantidad: detalle.cantidad,
        precioUnitario,
        subtotal,
      };
    });

    const montoTotal = detallesConPrecios.reduce(
      (sum, d) => sum.plus(d.subtotal),
      new Decimal(0),
    );

    // 4. Reducir stock temporalmente (se confirma o revierte según aprobación)
    await this.tandaRepository.consumirStock(tanda.id, cantidadTrabix);

    // 5. Crear la venta en estado PENDIENTE
    const venta = await this.ventaRepository.create({
      vendedorId,
      loteId: lote.id,
      tandaId: tanda.id,
      montoTotal,
      cantidadTrabix,
      detalles: detallesConPrecios,
    });

    this.logger.log(
      `Venta registrada: ${venta.id} - ${cantidadTrabix} TRABIX, $${montoTotal.toFixed(2)} - Vendedor: ${vendedorId}`,
    );

    return venta;
  }

  /**
   * Calcula la cantidad total de TRABIX de la venta
   */
  private calcularCantidadTrabix(
    detalles: { tipo: TipoVenta; cantidad: number }[],
  ): number {
    return detalles.reduce((sum, detalle) => {
      return sum + (detalle.cantidad * TRABIX_POR_TIPO[detalle.tipo]);
    }, 0);
  }
}
