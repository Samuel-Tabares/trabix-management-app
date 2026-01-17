import { Injectable } from '@nestjs/common';
import { MiniCuadre, EstadoMiniCuadre } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { PrismaService } from '@/infrastructure';
import {
  IMiniCuadreRepository,
  MiniCuadreConRelaciones,
  CreateMiniCuadreData,
} from '@modules/mini-cuadres/domain';

/**
 * Implementación del repositorio de mini-cuadres con Prisma
 */
@Injectable()
export class PrismaMiniCuadreRepository implements IMiniCuadreRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeRelations = {
    lote: {
      select: {
        id: true,
        vendedorId: true,
        estado: true,
        cantidadTrabix: true,
      },
    },
  };

  async findById(id: string): Promise<MiniCuadreConRelaciones | null> {
    return this.prisma.miniCuadre.findUnique({
      where: { id },
      include: this.includeRelations,
    }) as Promise<MiniCuadreConRelaciones | null>;
  }

  async findByLoteId(loteId: string): Promise<MiniCuadreConRelaciones | null> {
    return this.prisma.miniCuadre.findUnique({
      where: { loteId },
      include: this.includeRelations,
    }) as Promise<MiniCuadreConRelaciones | null>;
  }

  async create(data: CreateMiniCuadreData): Promise<MiniCuadre> {
    return this.prisma.miniCuadre.create({
      data: {
        loteId: data.loteId,
        tandaId: data.tandaId,
        estado: 'INACTIVO',
        montoFinal: 0,
      },
    });
  }

  async activar(id: string, montoFinal: Decimal): Promise<MiniCuadre> {
    return this.prisma.miniCuadre.update({
      where: { id },
      data: {
        estado: 'PENDIENTE',
        montoFinal: montoFinal.toFixed(2),
        fechaPendiente: new Date(),
      },
    });
  }

  async confirmarExitoso(id: string): Promise<MiniCuadre> {
    return this.prisma.miniCuadre.update({
      where: { id },
      data: {
        estado: 'EXITOSO',
        fechaExitoso: new Date(),
      },
    });
  }

  async findByEstado(estado: EstadoMiniCuadre): Promise<MiniCuadreConRelaciones[]> {
    return this.prisma.miniCuadre.findMany({
      where: { estado },
      include: this.includeRelations,
      orderBy: { fechaPendiente: 'asc' },
    }) as Promise<MiniCuadreConRelaciones[]>;
  }

  async countByEstado(estado: EstadoMiniCuadre): Promise<number> {
    return this.prisma.miniCuadre.count({
      where: { estado },
    });
  }
}
