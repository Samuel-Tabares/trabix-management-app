import { QueryHandler, IQueryHandler, IQuery } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import {
    IEquipamientoRepository,
    EQUIPAMIENTO_REPOSITORY,
} from '../../domain/equipamiento.repository.interface';
import { EquipamientoEntity } from '../../domain/equipamiento.entity';
import { DomainException } from '../../../../domain/exceptions/domain.exception';
import {
    QueryEquipamientosDto,
    EquipamientoResponseDto,
    EquipamientosPaginadosDto,
} from '../dto';

// ========== ObtenerEquipamientoQuery ==========

export class ObtenerEquipamientoQuery implements IQuery {
  constructor(public readonly equipamientoId: string) {}
}

@QueryHandler(ObtenerEquipamientoQuery)
export class ObtenerEquipamientoHandler
  implements IQueryHandler<ObtenerEquipamientoQuery, EquipamientoResponseDto>
{
  constructor(
    @Inject(EQUIPAMIENTO_REPOSITORY)
    private readonly equipamientoRepository: IEquipamientoRepository,
  ) {}

  async execute(query: ObtenerEquipamientoQuery): Promise<EquipamientoResponseDto> {
    const equipamiento = await this.equipamientoRepository.findById(query.equipamientoId);
    if (!equipamiento) {
      throw new DomainException('EQU_007', 'Equipamiento no encontrado');
    }
    return this.mapToDto(equipamiento);
  }

  private mapToDto(equipamiento: any): EquipamientoResponseDto {
    const entity = new EquipamientoEntity({
      ...equipamiento,
      deudaDano: equipamiento.deudaDano,
      deudaPerdida: equipamiento.deudaPerdida,
    });

    return {
      id: equipamiento.id,
      vendedorId: equipamiento.vendedorId,
      estado: equipamiento.estado,
      tieneDeposito: equipamiento.tieneDeposito,
      depositoPagado: equipamiento.depositoPagado ? Number.parseFloat(equipamiento.depositoPagado) : null,
      mensualidadActual: Number.parseFloat(equipamiento.mensualidadActual),
      ultimaMensualidadPagada: equipamiento.ultimaMensualidadPagada,
      deudaDano: Number.parseFloat(equipamiento.deudaDano),
      deudaPerdida: Number.parseFloat(equipamiento.deudaPerdida),
      fechaSolicitud: equipamiento.fechaSolicitud,
      fechaEntrega: equipamiento.fechaEntrega,
      fechaDevolucion: equipamiento.fechaDevolucion,
      depositoDevuelto: equipamiento.depositoDevuelto,
      fechaDevolucionDeposito: equipamiento.fechaDevolucionDeposito,
      mensualidadAlDia: entity.mensualidadAlDia(),
      deudaTotal: Number.parseFloat(entity.deudaTotal.toFixed(2)),
    };
  }
}

// ========== ObtenerMiEquipamientoQuery ==========

export class ObtenerMiEquipamientoQuery implements IQuery {
  constructor(public readonly vendedorId: string) {}
}

@QueryHandler(ObtenerMiEquipamientoQuery)
export class ObtenerMiEquipamientoHandler
  implements IQueryHandler<ObtenerMiEquipamientoQuery, EquipamientoResponseDto | null>
{
  constructor(
    @Inject(EQUIPAMIENTO_REPOSITORY)
    private readonly equipamientoRepository: IEquipamientoRepository,
  ) {}

  async execute(query: ObtenerMiEquipamientoQuery): Promise<EquipamientoResponseDto | null> {
    const equipamiento = await this.equipamientoRepository.findByVendedorId(query.vendedorId);
    if (!equipamiento) {
      return null;
    }
    return this.mapToDto(equipamiento);
  }

  private mapToDto(equipamiento: any): EquipamientoResponseDto {
    const entity = new EquipamientoEntity({
      ...equipamiento,
      deudaDano: equipamiento.deudaDano,
      deudaPerdida: equipamiento.deudaPerdida,
    });

    return {
      id: equipamiento.id,
      vendedorId: equipamiento.vendedorId,
      estado: equipamiento.estado,
      tieneDeposito: equipamiento.tieneDeposito,
      depositoPagado: equipamiento.depositoPagado ? Number.parseFloat(equipamiento.depositoPagado) : null,
      mensualidadActual: Number.parseFloat(equipamiento.mensualidadActual),
      ultimaMensualidadPagada: equipamiento.ultimaMensualidadPagada,
      deudaDano: Number.parseFloat(equipamiento.deudaDano),
      deudaPerdida: Number.parseFloat(equipamiento.deudaPerdida),
      fechaSolicitud: equipamiento.fechaSolicitud,
      fechaEntrega: equipamiento.fechaEntrega,
      fechaDevolucion: equipamiento.fechaDevolucion,
      depositoDevuelto: equipamiento.depositoDevuelto,
      fechaDevolucionDeposito: equipamiento.fechaDevolucionDeposito,
      mensualidadAlDia: entity.mensualidadAlDia(),
      deudaTotal: Number.parseFloat(entity.deudaTotal.toFixed(2)),
    };
  }
}

// ========== ListarEquipamientosQuery ==========

export class ListarEquipamientosQuery implements IQuery {
  constructor(public readonly filtros: QueryEquipamientosDto) {}
}

@QueryHandler(ListarEquipamientosQuery)
export class ListarEquipamientosHandler
  implements IQueryHandler<ListarEquipamientosQuery, EquipamientosPaginadosDto>
{
  constructor(
    @Inject(EQUIPAMIENTO_REPOSITORY)
    private readonly equipamientoRepository: IEquipamientoRepository,
  ) {}

  async execute(query: ListarEquipamientosQuery): Promise<EquipamientosPaginadosDto> {
    const resultado = await this.equipamientoRepository.findAll({
      skip: query.filtros.skip,
      take: query.filtros.take,
      where: {
        estado: query.filtros.estado,
        vendedorId: query.filtros.vendedorId,
      },
    });

    return {
      data: resultado.data.map((e) => this.mapToDto(e)),
      total: resultado.total,
      hasMore: resultado.hasMore,
    };
  }

  private mapToDto(equipamiento: any): EquipamientoResponseDto {
    const deudaDano = new Decimal(equipamiento.deudaDano || 0);
    const deudaPerdida = new Decimal(equipamiento.deudaPerdida || 0);

    return {
      id: equipamiento.id,
      vendedorId: equipamiento.vendedorId,
      estado: equipamiento.estado,
      tieneDeposito: equipamiento.tieneDeposito,
      depositoPagado: equipamiento.depositoPagado ? Number.parseFloat(equipamiento.depositoPagado) : null,
      mensualidadActual: Number.parseFloat(equipamiento.mensualidadActual),
      ultimaMensualidadPagada: equipamiento.ultimaMensualidadPagada,
      deudaDano: Number.parseFloat(deudaDano.toFixed(2)),
      deudaPerdida: Number.parseFloat(deudaPerdida.toFixed(2)),
      fechaSolicitud: equipamiento.fechaSolicitud,
      fechaEntrega: equipamiento.fechaEntrega,
      fechaDevolucion: equipamiento.fechaDevolucion,
      depositoDevuelto: equipamiento.depositoDevuelto,
      fechaDevolucionDeposito: equipamiento.fechaDevolucionDeposito,
      mensualidadAlDia: false, // Se calcula en detalle
      deudaTotal: Number.parseFloat(deudaDano.plus(deudaPerdida).toFixed(2)),
    };
  }
}

// Export handlers array
export const EquipamientoQueryHandlers = [
  ObtenerEquipamientoHandler,
  ObtenerMiEquipamientoHandler,
  ListarEquipamientosHandler,
];
