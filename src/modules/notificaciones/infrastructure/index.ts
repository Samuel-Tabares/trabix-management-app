import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure';
import {
  INotificacionRepository,
  NotificacionEntity,
  CreateNotificacionData,
  FindNotificacionesOptions,
  PaginatedNotificaciones,
} from '../domain/notificacion.entity';

@Injectable()
export class PrismaNotificacionRepository implements INotificacionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<NotificacionEntity | null> {
    const notificacion = await this.prisma.notificacion.findUnique({
      where: { id },
    });

    if (!notificacion) return null;

    return new NotificacionEntity({
      id: notificacion.id,
      usuarioId: notificacion.usuarioId,
      tipo: notificacion.tipo,
      titulo: notificacion.titulo,
      mensaje: notificacion.mensaje,
      datos: notificacion.datos as Record<string, any> | null,
      canal: notificacion.canal,
      leida: notificacion.leida,
      fechaCreacion: notificacion.fechaCreacion,
      fechaLeida: notificacion.fechaLeida,
    });
  }

  async findByUsuarioId(
    options: FindNotificacionesOptions,
  ): Promise<PaginatedNotificaciones> {
    const { usuarioId, skip = 0, take = 20, soloNoLeidas = false } = options;

    const where = {
      usuarioId,
      ...(soloNoLeidas ? { leida: false } : {}),
    };

    const [data, total, noLeidas] = await Promise.all([
      this.prisma.notificacion.findMany({
        where,
        skip,
        take: take + 1,
        orderBy: { fechaCreacion: 'desc' },
      }),
      this.prisma.notificacion.count({ where }),
      this.prisma.notificacion.count({
        where: { usuarioId, leida: false },
      }),
    ]);

    const hasMore = data.length > take;
    if (hasMore) data.pop();

    return {
      data: data.map(
        (n) =>
          new NotificacionEntity({
            id: n.id,
            usuarioId: n.usuarioId,
            tipo: n.tipo,
            titulo: n.titulo,
            mensaje: n.mensaje,
            datos: n.datos as Record<string, any> | null,
            canal: n.canal,
            leida: n.leida,
            fechaCreacion: n.fechaCreacion,
            fechaLeida: n.fechaLeida,
          }),
      ),
      total,
      noLeidas,
      hasMore,
    };
  }

  async create(data: CreateNotificacionData): Promise<NotificacionEntity> {
    const notificacion = await this.prisma.notificacion.create({
      data: {
        usuarioId: data.usuarioId,
        tipo: data.tipo,
        titulo: data.titulo,
        mensaje: data.mensaje,
        datos: data.datos || null,
        canal: data.canal || 'WEBSOCKET',
      },
    });

    return new NotificacionEntity({
      id: notificacion.id,
      usuarioId: notificacion.usuarioId,
      tipo: notificacion.tipo,
      titulo: notificacion.titulo,
      mensaje: notificacion.mensaje,
      datos: notificacion.datos as Record<string, any> | null,
      canal: notificacion.canal,
      leida: notificacion.leida,
      fechaCreacion: notificacion.fechaCreacion,
      fechaLeida: notificacion.fechaLeida,
    });
  }

  async marcarComoLeida(id: string): Promise<NotificacionEntity> {
    const notificacion = await this.prisma.notificacion.update({
      where: { id },
      data: {
        leida: true,
        fechaLeida: new Date(),
      },
    });

    return new NotificacionEntity({
      id: notificacion.id,
      usuarioId: notificacion.usuarioId,
      tipo: notificacion.tipo,
      titulo: notificacion.titulo,
      mensaje: notificacion.mensaje,
      datos: notificacion.datos as Record<string, any> | null,
      canal: notificacion.canal,
      leida: notificacion.leida,
      fechaCreacion: notificacion.fechaCreacion,
      fechaLeida: notificacion.fechaLeida,
    });
  }

  async marcarTodasComoLeidas(usuarioId: string): Promise<number> {
    const result = await this.prisma.notificacion.updateMany({
      where: { usuarioId, leida: false },
      data: {
        leida: true,
        fechaLeida: new Date(),
      },
    });

    return result.count;
  }

  async contarNoLeidas(usuarioId: string): Promise<number> {
    return this.prisma.notificacion.count({
      where: { usuarioId, leida: false },
    });
  }
}
