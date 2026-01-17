import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID, IsBoolean, IsObject } from 'class-validator';
import { TipoNotificacion, CanalNotificacion } from '@prisma/client';

// ========== Request DTOs ==========

export class EnviarNotificacionDto {
  @ApiProperty({ description: 'ID del usuario destinatario' })
  @IsUUID()
  usuarioId!: string;

  @ApiProperty({
    description: 'Tipo de notificación',
    enum: ['STOCK_BAJO', 'CUADRE_PENDIENTE', 'INVERSION_RECUPERADA', 'CUADRE_EXITOSO', 'TANDA_LIBERADA', 'MANUAL'],
  })
  @IsEnum(['STOCK_BAJO', 'CUADRE_PENDIENTE', 'INVERSION_RECUPERADA', 'CUADRE_EXITOSO', 'TANDA_LIBERADA', 'MANUAL'])
  tipo!: TipoNotificacion;

  @ApiPropertyOptional({ description: 'Título personalizado (para tipo MANUAL)' })
  @IsOptional()
  @IsString()
  titulo?: string;

  @ApiPropertyOptional({ description: 'Mensaje personalizado (para tipo MANUAL)' })
  @IsOptional()
  @IsString()
  mensaje?: string;

  @ApiPropertyOptional({ description: 'Datos adicionales' })
  @IsOptional()
  @IsObject()
  datos?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Canal de notificación',
    enum: ['WEBSOCKET', 'PUSH', 'WHATSAPP'],
    default: 'WEBSOCKET',
  })
  @IsOptional()
  @IsEnum(['WEBSOCKET', 'PUSH', 'WHATSAPP'])
  canal?: CanalNotificacion;
}

export class QueryNotificacionesDto {
  @ApiPropertyOptional({ description: 'Solo no leídas' })
  @IsOptional()
  @IsBoolean()
  soloNoLeidas?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  skip?: number = 0;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  take?: number = 20;
}

// ========== Response DTOs ==========

export class NotificacionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  usuarioId!: string;

  @ApiProperty({ enum: ['STOCK_BAJO', 'CUADRE_PENDIENTE', 'INVERSION_RECUPERADA', 'CUADRE_EXITOSO', 'TANDA_LIBERADA', 'MANUAL'] })
  tipo!: TipoNotificacion;

  @ApiProperty()
  titulo!: string;

  @ApiProperty()
  mensaje!: string;

  @ApiPropertyOptional()
  datos?: Record<string, any> | null;

  @ApiProperty({ enum: ['WEBSOCKET', 'PUSH', 'WHATSAPP'] })
  canal!: CanalNotificacion;

  @ApiProperty()
  leida!: boolean;

  @ApiProperty()
  fechaCreacion!: Date;

  @ApiPropertyOptional()
  fechaLeida?: Date | null;
}

export class NotificacionesPaginadasDto {
  @ApiProperty({ type: [NotificacionResponseDto] })
  data!: NotificacionResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  noLeidas!: number;

  @ApiProperty()
  hasMore!: boolean;
}
