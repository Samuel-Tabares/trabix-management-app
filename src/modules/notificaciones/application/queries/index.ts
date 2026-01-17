import { QueryHandler, IQueryHandler, IQuery } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  INotificacionRepository,
  NOTIFICACION_REPOSITORY,
} from '@modules/notificaciones/domain';
import {
  QueryNotificacionesDto,
  NotificacionesPaginadasDto,
} from '../dto';

// ========== ListarMisNotificacionesQuery ==========

export class ListarMisNotificacionesQuery implements IQuery {
  constructor(
    public readonly usuarioId: string,
    public readonly filtros: QueryNotificacionesDto,
  ) {}
}

@QueryHandler(ListarMisNotificacionesQuery)
export class ListarMisNotificacionesHandler
  implements IQueryHandler<ListarMisNotificacionesQuery, NotificacionesPaginadasDto>
{
  constructor(
    @Inject(NOTIFICACION_REPOSITORY)
    private readonly notificacionRepository: INotificacionRepository,
  ) {}

  async execute(
    query: ListarMisNotificacionesQuery,
  ): Promise<NotificacionesPaginadasDto> {
    const resultado = await this.notificacionRepository.findByUsuarioId({
      usuarioId: query.usuarioId,
      skip: query.filtros.skip,
      take: query.filtros.take,
      soloNoLeidas: query.filtros.soloNoLeidas,
    });

    return {
      data: resultado.data.map((n) => ({
        id: n.id,
        usuarioId: n.usuarioId,
        tipo: n.tipo,
        titulo: n.titulo,
        mensaje: n.mensaje,
        datos: n.datos,
        canal: n.canal,
        leida: n.leida,
        fechaCreacion: n.fechaCreacion,
        fechaLeida: n.fechaLeida,
      })),
      total: resultado.total,
      noLeidas: resultado.noLeidas,
      hasMore: resultado.hasMore,
    };
  }
}

// Export handlers array
export const NotificacionQueryHandlers = [ListarMisNotificacionesHandler];
