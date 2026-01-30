import { Module, OnModuleInit } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Módulos de infraestructura
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';

// Controllers
import { NotificacionesController } from './controllers';

// Gateways
import { NotificacionesGateway } from './gateways/notificaciones.gateway';

// Domain
import { NOTIFICACION_REPOSITORY } from './domain/notificacion.entity';

// Infrastructure
import { PrismaNotificacionRepository } from './infrastructure';

// Factories
import { NotificationContentFactory } from './factories/notification-content.factory';
import {
    NotificationDispatcher,
    WebSocketChannel,
    PushChannel,
    WhatsAppChannel,
} from './factories/notification-dispatcher';

// Application
import { NotificacionCommandHandlers } from './application/commands';
import { NotificacionQueryHandlers } from './application/queries';

/**
 * Módulo de Notificaciones
 * Según secciones 15 y 24 del documento
 *
 * Gestiona:
 * - Envío de notificaciones (Factory Pattern)
 * - Despacho multicanal (WebSocket, Push, WhatsApp)
 * - WebSocket Gateway para tiempo real
 * - Listado y marcado de notificaciones
 */
@Module({
    imports: [
        CqrsModule,
        PrismaModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('jwt.accessSecret'),
                signOptions: {
                    expiresIn: configService.get<string>('jwt.accessExpiresIn'),
                },
            }),
        }),
    ],
    controllers: [NotificacionesController],
    providers: [
        // Repository
        {
            provide: NOTIFICACION_REPOSITORY,
            useClass: PrismaNotificacionRepository,
        },
        // Gateway
        NotificacionesGateway,
        // Factories - Canales
        WebSocketChannel,
        PushChannel,
        WhatsAppChannel,
        // Factory - Content
        NotificationContentFactory,
        // Dispatcher
        NotificationDispatcher,
        // Command Handlers
        ...NotificacionCommandHandlers,
        // Query Handlers
        ...NotificacionQueryHandlers,
    ],
    exports: [
        NOTIFICACION_REPOSITORY,
        NotificationContentFactory,
        NotificationDispatcher,
        NotificacionesGateway,
    ],
})
export class NotificacionesModule implements OnModuleInit {
    constructor(
        private readonly gateway: NotificacionesGateway,
        private readonly dispatcher: NotificationDispatcher,
    ) {}

    onModuleInit(): void {
        // Conectar el gateway al canal WebSocket
        this.dispatcher.getWebSocketChannel().setGateway(this.gateway);
    }
}