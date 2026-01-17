import { QueryHandler, IQueryHandler, IQuery } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import {
  ILoteRepository,
  LOTE_REPOSITORY,
    CalculadoraInversionService,
} from '@/modules';
import { DomainException } from '@/domain';
import { ResumenFinancieroDto } from '../dto';

/**
 * Query para obtener el resumen financiero de un lote
 */
export class ResumenFinancieroQuery implements IQuery {
  constructor(public readonly loteId: string) {}
}

/**
 * Handler de la query ResumenFinanciero
 * Calcula todas las métricas financieras del lote según sección 16 del documento
 */
@QueryHandler(ResumenFinancieroQuery)
export class ResumenFinancieroHandler
  implements IQueryHandler<ResumenFinancieroQuery, ResumenFinancieroDto>
{
  constructor(
    @Inject(LOTE_REPOSITORY)
    private readonly loteRepository: ILoteRepository,
    private readonly calculadoraInversion: CalculadoraInversionService,
  ) {}

  async execute(query: ResumenFinancieroQuery): Promise<ResumenFinancieroDto> {
    const { loteId } = query;

    const lote = await this.loteRepository.findById(loteId);
    if (!lote) {
      throw new DomainException(
        'LOTE_003',
        'Lote no encontrado',
        { loteId },
      );
    }

    const inversionTotal = new Decimal(lote.inversionTotal);
    const inversionAdmin = new Decimal(lote.inversionAdmin);
    const inversionVendedor = new Decimal(lote.inversionVendedor);
    const dineroRecaudado = new Decimal(lote.dineroRecaudado);
    const dineroTransferido = new Decimal(lote.dineroTransferido);

    // Calcular ganancia total
    const gananciaTotal = dineroRecaudado.minus(inversionTotal);
    const hayGanancia = gananciaTotal.greaterThan(0);

    // Calcular ganancias según modelo de negocio
    let gananciaVendedor = new Decimal(0);
    let gananciaAdmin = new Decimal(0);

    if (hayGanancia) {
      if (lote.modeloNegocio === 'MODELO_60_40') {
        gananciaVendedor = gananciaTotal.times(0.6);
        gananciaAdmin = gananciaTotal.times(0.4);
      } else {
        // MODELO_50_50 - Para cascada completa se necesita la jerarquía
        gananciaVendedor = gananciaTotal.times(0.5);
        gananciaAdmin = gananciaTotal.times(0.5); // Simplificado sin cascada
      }
    }

    // Calcular stock
    let stockTotalDisponible = 0;
    let stockTotalVendido = 0;
    
    for (const tanda of lote.tandas) {
      stockTotalDisponible += tanda.stockActual;
      stockTotalVendido += tanda.stockInicial - tanda.stockActual;
    }

    // Calcular pendiente por transferir
    const pendientePorTransferir = dineroRecaudado.minus(dineroTransferido);

    // Porcentaje de recaudo
    const porcentajeRecaudo = inversionTotal.isZero()
      ? 0
      : dineroRecaudado.dividedBy(inversionTotal).times(100).toNumber();

    // Máximo de regalos y regalos utilizados

    // TODO: Calcular regalos utilizados de las ventas

    const maximoRegalos = this.calculadoraInversion.calcularMaximoRegalos(lote.cantidadTrabix);
    const regalosUtilizados = 0; // Se calculará cuando tengamos acceso a ventas

    return {
      loteId: lote.id,
      cantidadTrabix: lote.cantidadTrabix,
      modeloNegocio: lote.modeloNegocio,
      inversionTotal: Number.parseFloat(inversionTotal.toFixed(2)),
      inversionAdmin: Number.parseFloat(inversionAdmin.toFixed(2)),
      inversionVendedor: Number.parseFloat(inversionVendedor.toFixed(2)),
      dineroRecaudado: Number.parseFloat(dineroRecaudado.toFixed(2)),
      dineroTransferido: Number.parseFloat(dineroTransferido.toFixed(2)),
      pendientePorTransferir: Number.parseFloat(pendientePorTransferir.toFixed(2)),
      gananciaTotal: hayGanancia ? Number.parseFloat(gananciaTotal.toFixed(2)) : 0,
      gananciaVendedor: Number.parseFloat(gananciaVendedor.toFixed(2)),
      gananciaAdmin: Number.parseFloat(gananciaAdmin.toFixed(2)),
      porcentajeRecaudo: Number.parseFloat(porcentajeRecaudo.toFixed(2)),
      inversionRecuperada: dineroRecaudado.greaterThanOrEqualTo(inversionTotal),
      stockTotalDisponible,
      stockTotalVendido,
      regalosUtilizados,
      maximoRegalos,
    };
  }
}
