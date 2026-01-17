import { Injectable, Logger } from '@nestjs/common';
import { CanalNotificacion } from '@prisma/client';
import { NotificacionEntity } from '../domain/notificacion.entity';

/**
 * Interface para canales de notificación
 */
export interface INotificationChannel {
  readonly canal: CanalNotificacion;
  send(notificacion: NotificacionEntity): Promise<boolean>;
}

/**
 * Canal WebSocket
 */
@Injectable()
export class WebSocketChannel implements INotificationChannel {
  private readonly logger = new Logger(WebSocketChannel.name);
  readonly canal: CanalNotificacion = 'WEBSOCKET';

  // El gateway se inyectará en el módulo
  private gateway: any;

  setGateway(gateway: any): void {
    this.gateway = gateway;
  }

  async send(notificacion: NotificacionEntity): Promise<boolean> {
    try {
      if (this.gateway) {
        this.gateway.enviarNotificacion(notificacion.usuarioId, {
          id: notificacion.id,
          tipo: notificacion.tipo,
          titulo: notificacion.titulo,
          mensaje: notificacion.mensaje,
          datos: notificacion.datos,
          fechaCreacion: notificacion.fechaCreacion,
        });
        this.logger.log(`WebSocket enviado a ${notificacion.usuarioId}`);
        return true;
      }
      return false;
    } catch (error) {
        this.logger.error(
            `Error enviando WebSocket: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
        return false;
    }

  }
}

/**
 * Canal Push Notification (placeholder)
 */
@Injectable()
export class PushChannel implements INotificationChannel {
  private readonly logger = new Logger(PushChannel.name);
  readonly canal: CanalNotificacion = 'PUSH';

  async send(notificacion: NotificacionEntity): Promise<boolean> {
    try {
      // TODO: Implementar integración con servicio de push (Firebase, OneSignal, etc.)
      this.logger.log(`Push notification enviada a ${notificacion.usuarioId}`);
      return true;
    } catch (error) {
        this.logger.error(
            `Error enviando Push: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
        return false;
    }
  }
}

/**
 * Canal WhatsApp (placeholder)
 */
@Injectable()
export class WhatsAppChannel implements INotificationChannel {
  private readonly logger = new Logger(WhatsAppChannel.name);
  readonly canal: CanalNotificacion = 'WHATSAPP';

  async send(notificacion: NotificacionEntity): Promise<boolean> {
    try {
      // TODO: Implementar integración con WhatsApp Business API
      this.logger.log(`WhatsApp enviado a ${notificacion.usuarioId}`);
      return true;
    } catch (error) {
        this.logger.error(
            `Error enviando WhatsApp: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
        return false;
    }
  }
}

/**
 * NotificationDispatcher
 * Despacha notificaciones a múltiples canales
 */
@Injectable()
export class NotificationDispatcher {
  private readonly logger = new Logger(NotificationDispatcher.name);
  private readonly channels: Map<CanalNotificacion, INotificationChannel> = new Map();

  constructor(
    private readonly webSocketChannel: WebSocketChannel,
  ) {
    this.channels.set('WEBSOCKET', webSocketChannel);
  }

  /**
   * Despacha una notificación al canal especificado
   */
  async dispatch(notificacion: NotificacionEntity): Promise<boolean> {
    const channel = this.channels.get(notificacion.canal);
    
    if (!channel) {
      this.logger.warn(`Canal no encontrado: ${notificacion.canal}`);
      return false;
    }

    return channel.send(notificacion);
  }

  /**
   * Despacha una notificación a múltiples canales
   */
  async dispatchMultiple(
    notificacion: NotificacionEntity,
    canales: CanalNotificacion[],
  ): Promise<Map<CanalNotificacion, boolean>> {
    const results = new Map<CanalNotificacion, boolean>();

    for (const canal of canales) {
      const channel = this.channels.get(canal);
      if (channel) {
        const success = await channel.send(notificacion);
        results.set(canal, success);
      } else {
        results.set(canal, false);
      }
    }

    return results;
  }

  /**
   * Obtiene el canal WebSocket para configuración del gateway
   */
  getWebSocketChannel(): WebSocketChannel {
    return this.webSocketChannel;
  }
}
