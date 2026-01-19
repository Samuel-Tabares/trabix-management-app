import { Injectable } from '@nestjs/common';
import { CuadreMayor, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import {
    ICuadreMayorRepository,
    CuadreMayorConRelaciones,
    FindCuadresMayorOptions,
    PaginatedCuadresMayor,
    CreateCuadreMayorData,
} from '../domain/cuadre-mayor.repository.interface';

/**
 * Implementación del repositorio de cuadres al mayor con Prisma
 */
@Injectable()
export class PrismaCuadreMayorRepository implements ICuadreMayorRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeRelations = {
    ventaMayor: {
      select: {
        id: true,
        cantidadUnidades: true,
        conLicor: true,
        estado: true,
      },
    },
    gananciasReclutadores: true,
  };

  async findById(id: string): Promise<CuadreMayorConRelaciones | null> {
    return this.prisma.cuadreMayor.findUnique({
      where: { id },
      include: this.includeRelations,
    }) as Promise<CuadreMayorConRelaciones | null>;
  }

  async findByVentaMayorId(ventaMayorId: string): Promise<CuadreMayorConRelaciones | null> {
    return this.prisma.cuadreMayor.findUnique({
      where: { ventaMayorId },
      include: this.includeRelations,
    }) as Promise<CuadreMayorConRelaciones | null>;
  }

  async findAll(options?: FindCuadresMayorOptions): Promise<PaginatedCuadresMayor> {
    const { skip = 0, take = 20, cursor, where = {} } = options || {};

    const whereCondition: Prisma.CuadreMayorWhereInput = {};

    if (where.vendedorId) whereCondition.vendedorId = where.vendedorId;
    if (where.estado) whereCondition.estado = where.estado;
    if (where.modalidad) whereCondition.modalidad = where.modalidad;

    const queryOptions: Prisma.CuadreMayorFindManyArgs = {
      where: whereCondition,
      orderBy: { fechaRegistro: 'desc' },
      take: take + 1,
      include: this.includeRelations,
    };

    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1;
    } else {
      queryOptions.skip = skip;
    }

    const [cuadres, total] = await Promise.all([
      this.prisma.cuadreMayor.findMany(queryOptions),
      this.prisma.cuadreMayor.count({ where: whereCondition }),
    ]);

    const hasMore = cuadres.length > take;
    if (hasMore) cuadres.pop();

    return {
      data: cuadres as CuadreMayorConRelaciones[],
      total,
      hasMore,
      nextCursor: hasMore ? cuadres.at(-1)?.id : undefined,
    };
  }

  async findByVendedorId(
    vendedorId: string,
    options?: FindCuadresMayorOptions,
  ): Promise<PaginatedCuadresMayor> {
    return this.findAll({
      ...options,
      where: { ...options?.where, vendedorId },
    });
  }

  async create(data: CreateCuadreMayorData): Promise<CuadreMayor> {
    return this.prisma.$transaction(async (tx) => {
      // Serializar evaluación financiera para JSON
      const evaluacionJson = {
        dineroRecaudadoDetal: data.evaluacionFinanciera.dineroRecaudadoDetal.toFixed(2),
        dineroVentaMayor: data.evaluacionFinanciera.dineroVentaMayor.toFixed(2),
        dineroTotalDisponible: data.evaluacionFinanciera.dineroTotalDisponible.toFixed(2),
        inversionAdminTotal: data.evaluacionFinanciera.inversionAdminTotal.toFixed(2),
        inversionVendedorTotal: data.evaluacionFinanciera.inversionVendedorTotal.toFixed(2),
        inversionAdminCubierta: data.evaluacionFinanciera.inversionAdminCubierta.toFixed(2),
        inversionVendedorCubierta: data.evaluacionFinanciera.inversionVendedorCubierta.toFixed(2),
        gananciaNeta: data.evaluacionFinanciera.gananciaNeta.toFixed(2),
        gananciaAdmin: data.evaluacionFinanciera.gananciaAdmin.toFixed(2),
        gananciaVendedor: data.evaluacionFinanciera.gananciaVendedor.toFixed(2),
        deudasSaldadas: data.evaluacionFinanciera.deudasSaldadas.toFixed(2),
        gananciasReclutadores: data.evaluacionFinanciera.gananciasReclutadores.map((g) => ({
          reclutadorId: g.reclutadorId,
          nivel: g.nivel,
          monto: g.monto.toFixed(2),
        })),
      };

      // Serializar tandas afectadas para JSON
      const tandasAfectadasJson = data.tandasAfectadas.map((t) => ({
        tandaId: t.tandaId,
        cantidadStockConsumido: t.cantidadStockConsumido,
      }));

      // Crear el cuadre al mayor
      const cuadre = await tx.cuadreMayor.create({
        data: {
          ventaMayorId: data.ventaMayorId,
          vendedorId: data.vendedorId,
          modalidad: data.modalidad,
          estado: 'PENDIENTE',
          cantidadUnidades: data.cantidadUnidades,
          precioUnidad: data.precioUnidad.toFixed(2),
          ingresoBruto: data.ingresoBruto.toFixed(2),
          deudasSaldadas: data.deudasSaldadas.toFixed(2),
          inversionAdminLotesExistentes: data.inversionAdminLotesExistentes.toFixed(2),
          inversionAdminLoteForzado: data.inversionAdminLoteForzado.toFixed(2),
          inversionVendedorLotesExistentes: data.inversionVendedorLotesExistentes.toFixed(2),
          inversionVendedorLoteForzado: data.inversionVendedorLoteForzado.toFixed(2),
          gananciasAdmin: data.gananciasAdmin.toFixed(2),
          gananciasVendedor: data.gananciasVendedor.toFixed(2),
          evaluacionFinanciera: evaluacionJson,
          montoTotalAdmin: data.montoTotalAdmin.toFixed(2),
          montoTotalVendedor: data.montoTotalVendedor.toFixed(2),
          lotesInvolucradosIds: data.lotesInvolucradosIds,
          tandasAfectadas: tandasAfectadasJson,
          cuadresCerradosIds: [],
          loteForzadoId: data.loteForzadoId || null,
        },
      });

      // Crear ganancias de reclutadores
      if (data.gananciasReclutadores.length > 0) {
        await tx.gananciaReclutador.createMany({
          data: data.gananciasReclutadores.map((g) => ({
            cuadreMayorId: cuadre.id,
            reclutadorId: g.reclutadorId,
            nivel: g.nivel,
            monto: g.monto.toFixed(2),
            transferido: false,
          })),
        });
      }

      return cuadre;
    });
  }

  async confirmarExitoso(id: string, cuadresCerradosIds: string[]): Promise<CuadreMayor> {
    return this.prisma.cuadreMayor.update({
      where: { id },
      data: {
        estado: 'EXITOSO',
        cuadresCerradosIds,
        fechaExitoso: new Date(),
      },
    });
  }

  async count(options?: { vendedorId?: string; estado?: any }): Promise<number> {
    const where: Prisma.CuadreMayorWhereInput = {};
    if (options?.vendedorId) where.vendedorId = options.vendedorId;
    if (options?.estado) where.estado = options.estado;
    return this.prisma.cuadreMayor.count({ where });
  }
}
