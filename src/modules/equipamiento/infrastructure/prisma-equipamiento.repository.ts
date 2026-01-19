import { Injectable } from '@nestjs/common';
import { Equipamiento } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import {
    IEquipamientoRepository,
    CreateEquipamientoData,
    FindEquipamientosOptions,
    PaginatedEquipamientos,
} from '../domain/equipamiento.repository.interface';

@Injectable()
export class PrismaEquipamientoRepository implements IEquipamientoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Equipamiento | null> {
    return this.prisma.equipamiento.findUnique({ where: { id } });
  }

  async findByVendedorId(vendedorId: string): Promise<Equipamiento | null> {
    return this.prisma.equipamiento.findUnique({ where: { vendedorId } });
  }

  async findAll(options: FindEquipamientosOptions): Promise<PaginatedEquipamientos> {
    const { skip = 0, take = 20, where } = options;

    const [data, total] = await Promise.all([
      this.prisma.equipamiento.findMany({
        where,
        skip,
        take: take + 1,
        orderBy: { fechaSolicitud: 'desc' },
      }),
      this.prisma.equipamiento.count({ where }),
    ]);

    const hasMore = data.length > take;
    if (hasMore) data.pop();

    return { data, total, hasMore };
  }

  async create(data: CreateEquipamientoData): Promise<Equipamiento> {
    return this.prisma.equipamiento.create({
      data: {
        vendedorId: data.vendedorId,
        tieneDeposito: data.tieneDeposito,
        depositoPagado: data.depositoPagado?.toFixed(2),
        mensualidadActual: data.mensualidadActual.toFixed(2),
        estado: 'SOLICITADO',
      },
    });
  }

  async activar(id: string): Promise<Equipamiento> {
    return this.prisma.equipamiento.update({
      where: { id },
      data: {
        estado: 'ACTIVO',
        fechaEntrega: new Date(),
        ultimaMensualidadPagada: new Date(),
      },
    });
  }

  async registrarPagoMensualidad(id: string): Promise<Equipamiento> {
    return this.prisma.equipamiento.update({
      where: { id },
      data: {
        ultimaMensualidadPagada: new Date(),
      },
    });
  }

  async reportarDano(
    id: string,
    _tipoDano: 'NEVERA' | 'PIJAMA',
    monto: Decimal,
  ): Promise<Equipamiento> {
    return this.prisma.equipamiento.update({
      where: { id },
      data: {
        estado: 'DANADO',
        deudaDano: { increment: Number.parseFloat(monto.toFixed(2)) },
      },
    });
  }

  async reportarPerdida(id: string, monto: Decimal): Promise<Equipamiento> {
    return this.prisma.equipamiento.update({
      where: { id },
      data: {
        estado: 'PERDIDO',
        deudaPerdida: monto.toFixed(2),
      },
    });
  }

  async pagarDano(id: string, monto: Decimal): Promise<Equipamiento> {
    return this.prisma.equipamiento.update({
      where: { id },
      data: {
        deudaDano: { decrement: Number.parseFloat(monto.toFixed(2)) },
      },
    });
  }

  async devolver(id: string): Promise<Equipamiento> {
    return this.prisma.equipamiento.update({
      where: { id },
      data: {
        estado: 'DEVUELTO',
        fechaDevolucion: new Date(),
      },
    });
  }

  async devolverDeposito(id: string): Promise<Equipamiento> {
    return this.prisma.equipamiento.update({
      where: { id },
      data: {
        depositoDevuelto: true,
        fechaDevolucionDeposito: new Date(),
      },
    });
  }

  async reactivar(id: string): Promise<Equipamiento> {
    return this.prisma.equipamiento.update({
      where: { id },
      data: {
        estado: 'ACTIVO',
        deudaDano: 0,
      },
    });
  }
}
