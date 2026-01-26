import { QueryHandler, IQueryHandler, IQuery } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
    ICuadreRepository,
    CUADRE_REPOSITORY,
} from '../../domain/cuadre.repository.interface';
import { DomainException } from '../../../../domain/exceptions/domain.exception';
import { CuadreResponseDto, TandaCuadreResponseDto } from '../dto/cuadre-response.dto';

/**
 * Query para obtener un cuadre por ID
 */
export class ObtenerCuadreQuery implements IQuery {
  constructor(public readonly cuadreId: string) {}
}

/**
 * Handler de la query ObtenerCuadre
 */
@QueryHandler(ObtenerCuadreQuery)
export class ObtenerCuadreHandler
  implements IQueryHandler<ObtenerCuadreQuery, CuadreResponseDto>
{
  constructor(
    @Inject(CUADRE_REPOSITORY)
    private readonly cuadreRepository: ICuadreRepository,
  ) {}

  async execute(query: ObtenerCuadreQuery): Promise<CuadreResponseDto> {
    const { cuadreId } = query;

    const cuadre = await this.cuadreRepository.findById(cuadreId);
    if (!cuadre) {
      throw new DomainException(
        'CUA_001',
        'Cuadre no encontrado',
        { cuadreId },
      );
    }

    return this.mapToDto(cuadre);
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
