import { QueryHandler, IQueryHandler, IQuery } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
    ICuadreMayorRepository,
    CUADRE_MAYOR_REPOSITORY,
} from '../../domain/cuadre-mayor.repository.interface';
import { DomainException } from '../../../../domain/exceptions/domain.exception';
import {
    QueryCuadresMayorDto,
    CuadreMayorResponseDto,
    CuadresMayorPaginadosDto,
} from '../dto';

// ========== ObtenerCuadreMayorQuery ==========

export class ObtenerCuadreMayorQuery implements IQuery {
  constructor(public readonly cuadreMayorId: string) {}
}

@QueryHandler(ObtenerCuadreMayorQuery)
export class ObtenerCuadreMayorHandler
  implements IQueryHandler<ObtenerCuadreMayorQuery, CuadreMayorResponseDto>
{
  constructor(
    @Inject(CUADRE_MAYOR_REPOSITORY)
    private readonly cuadreMayorRepository: ICuadreMayorRepository,
  ) {}

  async execute(query: ObtenerCuadreMayorQuery): Promise<CuadreMayorResponseDto> {
    const cuadre = await this.cuadreMayorRepository.findById(query.cuadreMayorId);
    if (!cuadre) {
      throw new DomainException('CMA_002', 'Cuadre al mayor no encontrado', {
        cuadreMayorId: query.cuadreMayorId,
      });
    }
    return this.mapToDto(cuadre);
  }

  private mapToDto(cuadre: any): CuadreMayorResponseDto {
    const evaluacion = cuadre.evaluacionFinanciera;
    
    return {
      id: cuadre.id,
      ventaMayorId: cuadre.ventaMayorId,
      vendedorId: cuadre.vendedorId,
      modalidad: cuadre.modalidad,
      estado: cuadre.estado,
      cantidadUnidades: cuadre.cantidadUnidades,
      precioUnidad: Number.parseFloat(cuadre.precioUnidad),
      ingresoBruto: Number.parseFloat(cuadre.ingresoBruto),
      deudasSaldadas: Number.parseFloat(cuadre.deudasSaldadas),
      inversionAdminLotesExistentes: Number.parseFloat(cuadre.inversionAdminLotesExistentes),
      inversionAdminLoteForzado: Number.parseFloat(cuadre.inversionAdminLoteForzado),
      inversionVendedorLotesExistentes: Number.parseFloat(cuadre.inversionVendedorLotesExistentes),
      inversionVendedorLoteForzado: Number.parseFloat(cuadre.inversionVendedorLoteForzado),
      gananciasAdmin: Number.parseFloat(cuadre.gananciasAdmin),
      gananciasVendedor: Number.parseFloat(cuadre.gananciasVendedor),
      evaluacionFinanciera: {
        dineroRecaudadoDetal: Number.parseFloat(evaluacion?.dineroRecaudadoDetal || '0'),
        dineroVentaMayor: Number.parseFloat(evaluacion?.dineroVentaMayor || '0'),
        dineroTotalDisponible: Number.parseFloat(evaluacion?.dineroTotalDisponible || '0'),
        inversionAdminTotal: Number.parseFloat(evaluacion?.inversionAdminTotal || '0'),
        inversionVendedorTotal: Number.parseFloat(evaluacion?.inversionVendedorTotal || '0'),
        gananciaNeta: Number.parseFloat(evaluacion?.gananciaNeta || '0'),
        gananciaAdmin: Number.parseFloat(evaluacion?.gananciaAdmin || '0'),
        gananciaVendedor: Number.parseFloat(evaluacion?.gananciaVendedor || '0'),
        deudasSaldadas: Number.parseFloat(evaluacion?.deudasSaldadas || '0'),
      },
      montoTotalAdmin: Number.parseFloat(cuadre.montoTotalAdmin),
      montoTotalVendedor: Number.parseFloat(cuadre.montoTotalVendedor),
      lotesInvolucradosIds: cuadre.lotesInvolucradosIds || [],
      tandasAfectadas: (cuadre.tandasAfectadas as any[])?.map((t) => ({
        tandaId: t.tandaId,
        cantidadStockConsumido: t.cantidadStockConsumido,
      })) || [],
      cuadresCerradosIds: cuadre.cuadresCerradosIds || [],
      loteForzadoId: cuadre.loteForzadoId,
      gananciasReclutadores: cuadre.gananciasReclutadores?.map((g: any) => ({
        reclutadorId: g.reclutadorId,
        nivel: g.nivel,
        monto: Number.parseFloat(g.monto),
        transferido: g.transferido,
      })) || [],
      fechaRegistro: cuadre.fechaRegistro,
      fechaExitoso: cuadre.fechaExitoso,
    };
  }
}

// ========== ListarCuadresMayorQuery ==========

export class ListarCuadresMayorQuery implements IQuery {
  constructor(public readonly filtros: QueryCuadresMayorDto) {}
}

@QueryHandler(ListarCuadresMayorQuery)
export class ListarCuadresMayorHandler
  implements IQueryHandler<ListarCuadresMayorQuery, CuadresMayorPaginadosDto>
{
  constructor(
    @Inject(CUADRE_MAYOR_REPOSITORY)
    private readonly cuadreMayorRepository: ICuadreMayorRepository,
  ) {}

  async execute(query: ListarCuadresMayorQuery): Promise<CuadresMayorPaginadosDto> {
    const resultado = await this.cuadreMayorRepository.findAll({
      skip: query.filtros.skip,
      take: query.filtros.take,
      cursor: query.filtros.cursor,
      where: {
        vendedorId: query.filtros.vendedorId,
        estado: query.filtros.estado,
        modalidad: query.filtros.modalidad,
      },
    });

    return {
      data: resultado.data.map((c) => this.mapToDto(c)),
      total: resultado.total,
      hasMore: resultado.hasMore,
      nextCursor: resultado.nextCursor,
    };
  }

  private mapToDto(cuadre: any): CuadreMayorResponseDto {
    const evaluacion = cuadre.evaluacionFinanciera;
    
    return {
      id: cuadre.id,
      ventaMayorId: cuadre.ventaMayorId,
      vendedorId: cuadre.vendedorId,
      modalidad: cuadre.modalidad,
      estado: cuadre.estado,
      cantidadUnidades: cuadre.cantidadUnidades,
      precioUnidad: Number.parseFloat(cuadre.precioUnidad),
      ingresoBruto: Number.parseFloat(cuadre.ingresoBruto),
      deudasSaldadas: Number.parseFloat(cuadre.deudasSaldadas),
      inversionAdminLotesExistentes: Number.parseFloat(cuadre.inversionAdminLotesExistentes),
      inversionAdminLoteForzado: Number.parseFloat(cuadre.inversionAdminLoteForzado),
      inversionVendedorLotesExistentes: Number.parseFloat(cuadre.inversionVendedorLotesExistentes),
      inversionVendedorLoteForzado: Number.parseFloat(cuadre.inversionVendedorLoteForzado),
      gananciasAdmin: Number.parseFloat(cuadre.gananciasAdmin),
      gananciasVendedor: Number.parseFloat(cuadre.gananciasVendedor),
      evaluacionFinanciera: {
        dineroRecaudadoDetal: Number.parseFloat(evaluacion?.dineroRecaudadoDetal || '0'),
        dineroVentaMayor: Number.parseFloat(evaluacion?.dineroVentaMayor || '0'),
        dineroTotalDisponible: Number.parseFloat(evaluacion?.dineroTotalDisponible || '0'),
        inversionAdminTotal: Number.parseFloat(evaluacion?.inversionAdminTotal || '0'),
        inversionVendedorTotal: Number.parseFloat(evaluacion?.inversionVendedorTotal || '0'),
        gananciaNeta: Number.parseFloat(evaluacion?.gananciaNeta || '0'),
        gananciaAdmin: Number.parseFloat(evaluacion?.gananciaAdmin || '0'),
        gananciaVendedor: Number.parseFloat(evaluacion?.gananciaVendedor || '0'),
        deudasSaldadas: Number.parseFloat(evaluacion?.deudasSaldadas || '0'),
      },
      montoTotalAdmin: Number.parseFloat(cuadre.montoTotalAdmin),
      montoTotalVendedor: Number.parseFloat(cuadre.montoTotalVendedor),
      lotesInvolucradosIds: cuadre.lotesInvolucradosIds || [],
      tandasAfectadas: (cuadre.tandasAfectadas as any[])?.map((t) => ({
        tandaId: t.tandaId,
        cantidadStockConsumido: t.cantidadStockConsumido,
      })) || [],
      cuadresCerradosIds: cuadre.cuadresCerradosIds || [],
      loteForzadoId: cuadre.loteForzadoId,
      gananciasReclutadores: cuadre.gananciasReclutadores?.map((g: any) => ({
        reclutadorId: g.reclutadorId,
        nivel: g.nivel,
        monto: Number.parseFloat(g.monto),
        transferido: g.transferido,
      })) || [],
      fechaRegistro: cuadre.fechaRegistro,
      fechaExitoso: cuadre.fechaExitoso,
    };
  }
}

// Export handlers
export const CuadreMayorQueryHandlers = [
  ObtenerCuadreMayorHandler,
  ListarCuadresMayorHandler,
];
