import { CommandHandler, ICommandHandler, ICommand } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { TipoNotificacion, CanalNotificacion } from '@prisma/client';
import {
    INotificacionRepository,
    NOTIFICACION_REPOSITORY,
} from '../../domain/notificacion.entity';
import {
    NotificationContentFactory,
    NotificationDispatcher,
} from '../../factories';
import { DomainException } from '../../../../domain/exceptions/domain.exception';

// ========== EnviarNotificacionCommand ==========

export class EnviarNotificacionCommand implements ICommand {
  constructor(
    public readonly usuarioId: string,
    public readonly tipo: TipoNotificacion,
    public readonly datos?: Record<string, any>,
    public readonly canal?: CanalNotificacion,
  ) {}
}

@CommandHandler(EnviarNotificacionCommand)
export class EnviarNotificacionHandler
  implements ICommandHandler<EnviarNotificacionCommand>
{
  private readonly logger = new Logger(EnviarNotificacionHandler.name);

  constructor(
    @Inject(NOTIFICACION_REPOSITORY)
    private readonly notificacionRepository: INotificacionRepository,
    private readonly contentFactory: NotificationContentFactory,
    private readonly dispatcher: NotificationDispatcher,
  ) {}

  async execute(command: EnviarNotificacionCommand): Promise<any> {
    // Crear contenido usando factory
    const content = this.contentFactory.create(
      command.tipo,
      command.datos || {},
    );

    // Guardar en base de datos
    const notificacion = await this.notificacionRepository.create({
      usuarioId: command.usuarioId,
      tipo: command.tipo,
      titulo: content.titulo,
      mensaje: content.mensaje,
      datos: content.datos,
      canal: command.canal || 'WEBSOCKET',
    });

    // Despachar por canal
    await this.dispatcher.dispatch(notificacion);

    this.logger.log(
      `Notificación enviada: ${notificacion.id} - ${command.tipo} a ${command.usuarioId}`,
    );

    return notificacion;
  }
}

// ========== MarcarNotificacionLeidaCommand ==========

export class MarcarNotificacionLeidaCommand implements ICommand {
  constructor(
    public readonly notificacionId: string,
    public readonly usuarioId: string,
  ) {}
}

@CommandHandler(MarcarNotificacionLeidaCommand)
export class MarcarNotificacionLeidaHandler
  implements ICommandHandler<MarcarNotificacionLeidaCommand>
{
  private readonly logger = new Logger(MarcarNotificacionLeidaHandler.name);

  constructor(
    @Inject(NOTIFICACION_REPOSITORY)
    private readonly notificacionRepository: INotificacionRepository,
  ) {}

  async execute(command: MarcarNotificacionLeidaCommand): Promise<any> {
    const notificacion = await this.notificacionRepository.findById(
      command.notificacionId,
    );

    if (!notificacion) {
      throw new DomainException('NOT_002', 'Notificación no encontrada');
    }

    // Verificar que pertenece al usuario
    if (notificacion.usuarioId !== command.usuarioId) {
      throw new DomainException('NOT_003', 'No tienes permiso para esta notificación');
    }

    // Validar que no esté leída
    notificacion.validarMarcarLeida();

    const actualizada = await this.notificacionRepository.marcarComoLeida(
      command.notificacionId,
    );

    this.logger.log(`Notificación marcada como leída: ${command.notificacionId}`);

    return actualizada;
  }
}

// Export handlers array
export const NotificacionCommandHandlers = [
  EnviarNotificacionHandler,
  MarcarNotificacionLeidaHandler,
];
