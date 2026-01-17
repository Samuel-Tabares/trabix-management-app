import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CurrentUser, AuthenticatedUser, Roles } from '@/modules';

// DTOs
import {
  EnviarNotificacionDto,
  QueryNotificacionesDto,
  NotificacionResponseDto,
  NotificacionesPaginadasDto,
} from '../application/dto';

// Commands
import {
  EnviarNotificacionCommand,
  MarcarNotificacionLeidaCommand,
} from '../application/commands';

// Queries
import { ListarMisNotificacionesQuery } from '../application/queries';

/**
 * Controlador de Notificaciones
 * Según sección 20.13 del documento
 */
@ApiTags('Notificaciones')
@ApiBearerAuth('access-token')
@Controller('notificaciones')
export class NotificacionesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * GET /notificaciones
   * Listar mis notificaciones
   */
  @Get()
  @ApiOperation({ summary: 'Listar mis notificaciones' })
  @ApiResponse({ status: 200, type: NotificacionesPaginadasDto })
  async listarMias(
    @Query() queryDto: QueryNotificacionesDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NotificacionesPaginadasDto> {
    return this.queryBus.execute(
      new ListarMisNotificacionesQuery(user.id, queryDto),
    );
  }

  /**
   * PATCH /notificaciones/:id/leer
   * Marcar como leída
   */
  @Patch(':id/leer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar como leída' })
  @ApiParam({ name: 'id', description: 'ID de la notificación' })
  @ApiResponse({ status: 200, type: NotificacionResponseDto })
  async marcarLeida(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NotificacionResponseDto> {
    const notificacion = await this.commandBus.execute(
      new MarcarNotificacionLeidaCommand(id, user.id),
    );

    return {
      id: notificacion.id,
      usuarioId: notificacion.usuarioId,
      tipo: notificacion.tipo,
      titulo: notificacion.titulo,
      mensaje: notificacion.mensaje,
      datos: notificacion.datos,
      canal: notificacion.canal,
      leida: notificacion.leida,
      fechaCreacion: notificacion.fechaCreacion,
      fechaLeida: notificacion.fechaLeida,
    };
  }

  /**
   * POST /notificaciones/enviar
   * Enviar notificación (admin)
   */
  @Post('enviar')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enviar notificación (admin)' })
  @ApiResponse({ status: 201, type: NotificacionResponseDto })
  async enviar(
    @Body() dto: EnviarNotificacionDto,
  ): Promise<NotificacionResponseDto> {
    const notificacion = await this.commandBus.execute(
      new EnviarNotificacionCommand(
        dto.usuarioId,
        dto.tipo,
        { ...dto.datos, titulo: dto.titulo, mensaje: dto.mensaje },
        dto.canal,
      ),
    );

    return {
      id: notificacion.id,
      usuarioId: notificacion.usuarioId,
      tipo: notificacion.tipo,
      titulo: notificacion.titulo,
      mensaje: notificacion.mensaje,
      datos: notificacion.datos,
      canal: notificacion.canal,
      leida: notificacion.leida,
      fechaCreacion: notificacion.fechaCreacion,
      fechaLeida: notificacion.fechaLeida,
    };
  }
}
