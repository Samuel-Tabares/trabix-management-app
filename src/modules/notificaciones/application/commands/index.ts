import { CommandHandler, ICommandHandler, ICommand } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { TipoNotificacion, CanalNotificacion } from '@prisma/client';
import {
    INotificacionRepository,
    NOTIFICACION_REPOSITORY,
    NotificacionEntity,
} from '../../domain/notificacion.entity';
import { NotificationDispatcher } from '../../factories/notification-dispatcher';
import { NotificationContentFactory } from '../../factories/notification-content.factory';
import { DomainException } from '../../../../domain/exceptions/domain.exception';

// ========== EnviarNotificacionCommand ==========

export class EnviarNotificacionCommand implements ICommand {
    constructor(
        public readonly usuarioId: string,
        public readonly tipo: TipoNotificacion,
        public readonly datos?: Record<string, unknown>,
        public readonly canal?: CanalNotificacion,
    ) {}
}

@CommandHandler(EnviarNotificacionCommand)
export class EnviarNotificacionHandler
    implements ICommandHandler<EnviarNotificacionCommand, NotificacionEntity>
{
    private readonly logger = new Logger(EnviarNotificacionHandler.name);

    constructor(
        @Inject(NOTIFICACION_REPOSITORY)
        private readonly notificacionRepository: INotificacionRepository,
        private readonly contentFactory: NotificationContentFactory,
        private readonly dispatcher: NotificationDispatcher,
    ) {}

    async execute(command: EnviarNotificacionCommand): Promise<NotificacionEntity> {
        this.logger.debug(
            `Enviando notificación ${command.tipo} a usuario ${command.usuarioId}`,
        );

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
            datos: content.datos as Record<string, unknown>,
            canal: command.canal || 'WEBSOCKET',
        });

        // Despachar por canal
        const enviado = await this.dispatcher.dispatch(notificacion);

        if (!enviado) {
            this.logger.warn(
                `No se pudo enviar notificación ${notificacion.id} por canal ${notificacion.canal}`,
            );
        }

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
    implements ICommandHandler<MarcarNotificacionLeidaCommand, NotificacionEntity>
{
    private readonly logger = new Logger(MarcarNotificacionLeidaHandler.name);

    constructor(
        @Inject(NOTIFICACION_REPOSITORY)
        private readonly notificacionRepository: INotificacionRepository,
    ) {}

    async execute(
        command: MarcarNotificacionLeidaCommand,
    ): Promise<NotificacionEntity> {
        const notificacion = await this.notificacionRepository.findById(
            command.notificacionId,
        );

        if (!notificacion) {
            throw new DomainException('NOT_002', 'Notificación no encontrada');
        }

        // Verificar que pertenece al usuario
        if (notificacion.usuarioId !== command.usuarioId) {
            throw new DomainException(
                'NOT_003',
                'No tienes permiso para esta notificación',
            );
        }

        // Validar que no esté leída
        notificacion.validarMarcarLeida();

        const actualizada = await this.notificacionRepository.marcarComoLeida(
            command.notificacionId,
        );

        this.logger.log(
            `Notificación marcada como leída: ${command.notificacionId}`,
        );

        return actualizada;
    }
}

// ========== MarcarTodasLeidasCommand ==========

export class MarcarTodasLeidasCommand implements ICommand {
    constructor(
        public readonly usuarioId: string,
        public readonly tipo?: TipoNotificacion,
    ) {}
}

@CommandHandler(MarcarTodasLeidasCommand)
export class MarcarTodasLeidasHandler
    implements ICommandHandler<MarcarTodasLeidasCommand, number>
{
    private readonly logger = new Logger(MarcarTodasLeidasHandler.name);

    constructor(
        @Inject(NOTIFICACION_REPOSITORY)
        private readonly notificacionRepository: INotificacionRepository,
    ) {}

    async execute(command: MarcarTodasLeidasCommand): Promise<number> {
        const cantidad = await this.notificacionRepository.marcarTodasComoLeidas(
            command.usuarioId,
            command.tipo,
        );

        this.logger.log(
            `${cantidad} notificaciones marcadas como leídas para usuario ${command.usuarioId}`,
        );

        return cantidad;
    }
}

// Export handlers array
export const NotificacionCommandHandlers = [
    EnviarNotificacionHandler,
    MarcarNotificacionLeidaHandler,
    MarcarTodasLeidasHandler,
];