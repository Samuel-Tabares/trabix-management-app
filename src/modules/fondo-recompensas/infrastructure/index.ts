import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import {
  IFondoRecompensasRepository,
  CreateMovimientoData,
  MovimientoFondo,
  TipoMovimientoFondo,
} from '../domain';

@Injectable()
export class PrismaFondoRecompensasRepository implements IFondoRecompensasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerSaldo(): Promise<Decimal> {
    // Calcular saldo sumando entradas y restando salidas
    const resultEntradas = await this.prisma.movimientoFondo.aggregate({
      _sum: {
        monto: true,
      },
      where: {
        tipo: 'ENTRADA',
      },
    });

    const resultSalidas = await this.prisma.movimientoFondo.aggregate({
      _sum: {
        monto: true,
      },
      where: {
        tipo: 'SALIDA',
      },
    });

    const entradas = new Decimal(resultEntradas._sum.monto || 0);
    const salidas = new Decimal(resultSalidas._sum.monto || 0);

    return entradas.minus(salidas);
  }

  async listarMovimientos(options: {
    skip?: number;
    take?: number;
    tipo?: TipoMovimientoFondo;
  }): Promise<{
    data: MovimientoFondo[];
    total: number;
    hasMore: boolean;
  }> {
    const { skip = 0, take = 20, tipo } = options;

    const where = tipo ? { tipo } : {};

    const [data, total] = await Promise.all([
      this.prisma.movimientoFondo.findMany({
        where,
        skip,
        take: take + 1,
        orderBy: { fechaTransaccion: 'desc' },
      }),
      this.prisma.movimientoFondo.count({ where }),
    ]);

    const hasMore = data.length > take;
    if (hasMore) data.pop();

    return {
      data: data.map((m) => ({
        id: m.id,
        tipo: m.tipo as TipoMovimientoFondo,
        monto: new Decimal(m.monto),
        concepto: m.concepto,
        loteId: m.loteId || undefined,
        vendedorBeneficiarioId: m.vendedorBeneficiarioId || undefined,
        fechaTransaccion: m.fechaTransaccion,
      })),
      total,
      hasMore,
    };
  }

  async registrarEntrada(data: CreateMovimientoData): Promise<MovimientoFondo> {
    const movimiento = await this.prisma.movimientoFondo.create({
      data: {
        tipo: 'ENTRADA',
        monto: data.monto.toFixed(2),
        concepto: data.concepto,
        loteId: data.loteId,
      },
    });

    return {
      id: movimiento.id,
      tipo: 'ENTRADA',
      monto: new Decimal(movimiento.monto),
      concepto: movimiento.concepto,
      loteId: movimiento.loteId || undefined,
      fechaTransaccion: movimiento.fechaTransaccion,
    };
  }

  async registrarSalida(data: CreateMovimientoData): Promise<MovimientoFondo> {
    const movimiento = await this.prisma.movimientoFondo.create({
      data: {
        tipo: 'SALIDA',
        monto: data.monto.toFixed(2),
        concepto: data.concepto,
        vendedorBeneficiarioId: data.vendedorBeneficiarioId,
      },
    });

    return {
      id: movimiento.id,
      tipo: 'SALIDA',
      monto: new Decimal(movimiento.monto),
      concepto: movimiento.concepto,
      vendedorBeneficiarioId: movimiento.vendedorBeneficiarioId || undefined,
      fechaTransaccion: movimiento.fechaTransaccion,
    };
  }
}
