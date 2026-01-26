import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Payload de autenticación WebSocket
 */
interface AuthPayload {
  token: string;
}

/**
 * Usuario conectado
 */
interface ConnectedUser {
  socketId: string;
  usuarioId: string;
}

/**
 * WebSocket Gateway para Notificaciones
 * Según sección 24 del documento
 * 
 * Gateway: /ws/notificaciones
 * 
 * Eventos que emite el servidor:
 * - nueva-notificacion
 * - stock-actualizado
 * - cuadre-pendiente
 * - tanda-liberada
 * 
 * Eventos que recibe el servidor:
 * - subscribir (con JWT)
 * - marcar-leida
 */
@WebSocketGateway({
  namespace: '/ws/notificaciones',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class NotificacionesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificacionesGateway.name);
  private readonly connectedUsers: Map<string, ConnectedUser> = new Map();

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Maneja nueva conexión
   */
  async handleConnection(client: Socket): Promise<void> {
    this.logger.log(`Cliente conectado: ${client.id}`);

    try {
      // Intentar autenticar desde handshake
      const token = client.handshake.auth?.token;
      if (token) {
        await this.authenticateClient(client, token);
      }
    } catch (error) {
        this.logger.warn(
            `Error en conexión inicial: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
  }

  /**
   * Maneja desconexión
   */
  handleDisconnect(client: Socket): void {
    this.connectedUsers.delete(client.id);
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  /**
   * Suscribe un cliente a notificaciones (con JWT)
   */
  @SubscribeMessage('subscribir')
  async handleSubscribir(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: AuthPayload,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.authenticateClient(client, data.token);
      return { success: true, message: 'Suscrito exitosamente' };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : String(error),
        };
    }
  }

  /**
   * Marca una notificación como leída
   */
  @SubscribeMessage('marcar-leida')
  async handleMarcarLeida(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificacionId: string },
  ): Promise<{ success: boolean }> {
    const user = this.connectedUsers.get(client.id);
    if (!user) {
      return { success: false };
    }

    // El comando de marcar leída se ejecutará desde el controller
    this.logger.log(
      `Notificación ${data.notificacionId} marcada como leída por ${user.usuarioId}`,
    );
    return { success: true };
  }

  /**
   * Autentica un cliente con JWT
   */
  private async authenticateClient(client: Socket, token: string): Promise<void> {
      try {
          const payload = this.jwtService.verify(token, {
              secret: this.configService.get<string>('jwt.accessSecret'),
          });

          this.connectedUsers.set(client.id, {
              socketId: client.id,
              usuarioId: payload.sub,
          });

          client.join(`user:${payload.sub}`);

          this.logger.log(
              `Usuario ${payload.sub} autenticado en socket ${client.id}`,
          );
      } catch {
          throw new UnauthorizedException('Token inválido');
      }
  }

  // ========== Métodos para emitir eventos ==========

  /**
   * Envía una notificación a un usuario específico
   */
  enviarNotificacion(usuarioId: string, notificacion: any): void {
    this.server.to(`user:${usuarioId}`).emit('nueva-notificacion', notificacion);
    this.logger.log(`Notificación enviada a usuario ${usuarioId}`);
  }
}
