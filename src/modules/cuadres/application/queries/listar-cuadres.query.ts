import { QueryHandler, IQueryHandler, IQuery } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
    ICuadreRepository,
    CUADRE_REPOSITORY,
} from '../../domain/cuadre.repository.interface';
import {
    QueryCuadresDto,
    CuadresPaginadosDto,
    CuadreResponseDto,
    TandaCuadreResponseDto,
} from '../dto';

/**
 * Query para listar cuadres con filtros y paginación
 */
export class ListarCuadresQuery implements IQuery {
  constructor(public readonly filtros: QueryCuadresDto) {}
}

/**
 * Handler de la query ListarCuadres
 */
@QueryHandler(ListarCuadresQuery)
export class ListarCuadresHandler
  implements IQueryHandler<ListarCuadresQuery, CuadresPaginadosDto>
{
  constructor(
    @Inject(CUADRE_REPOSITORY)
    private readonly cuadreRepository: ICuadreRepository,
  ) {}

  async execute(query: ListarCuadresQuery): Promise<CuadresPaginadosDto> {
    const { filtros } = query;

    const resultado = await this.cuadreRepository.findAll({
      skip: filtros.skip,
      take: filtros.take,
      cursor: filtros.cursor,
      where: {
        loteId: filtros.loteId,
        vendedorId: filtros.vendedorId,
        estado: filtros.estado,
        concepto: filtros.concepto,
      },
    });

    const data: CuadreResponseDto[] = resultado.data.map((cuadre) =>
      this.mapToDto(cuadre),
    );

    return {
      data,
      total: resultado.total,
      hasMore: resultado.hasMore,
      nextCursor: resultado.nextCursor,
    };
  }

  private mapToDto(cuadre: any): CuadreResponseDto {
    const montoEsperado = Number.parseFloat(cuadre.montoEsperado);
    const montoCubiertoPorMayor = Number.parseFloat(cuadre.montoCubiertoPorMayor);
    const montoEsperadoAjustado = montoEsperado - montoCubiertoPorMayor;

    const tanda: TandaCuadreResponseDto = {
      id: cuadre.tanda.id,
      loteId: cuadre.tanda.loteId,
      numero: cuadre.tanda.numero,
      stockInicial: cuadre.tanda.stockInicial,
      stockActual: cuadre.tanda.stockActual,
      estado: cuadre.tanda.estado,
    };

    return {
      id: cuadre.id,
      tandaId: cuadre.tandaId,
      estado: cuadre.estado,
      concepto: cuadre.concepto,
      montoEsperado,
      montoRecibido: Number.parseFloat(cuadre.montoRecibido),
      montoFaltante: Number.parseFloat(cuadre.montoFaltante),
      montoCubiertoPorMayor,
      montoEsperadoAjustado,
      cerradoPorCuadreMayorId: cuadre.cerradoPorCuadreMayorId,
      fechaPendiente: cuadre.fechaPendiente,
      fechaExitoso: cuadre.fechaExitoso,
      tanda,
      fueCerradoPorMayor: cuadre.cerradoPorCuadreMayorId !== null,
    };
  }
}
