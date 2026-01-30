import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsEnum,
    IsOptional,
    IsUUID,
    IsBoolean,
    IsObject,
    IsInt,
    Min,
    Max,
    ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TipoNotificacion, CanalNotificacion } from '@prisma/client';

// ========== Constantes ==========

export const TIPOS_NOTIFICACION = [
    'STOCK_BAJO',
    'CUADRE_PENDIENTE',
    'INVERSION_RECUPERADA',
    'CUADRE_EXITOSO',
    'TANDA_LIBERADA',
    'MANUAL',
    'PREMIO_RECIBIDO',
] as const;

export const CANALES_NOTIFICACION = ['WEBSOCKET', 'PUSH', 'WHATSAPP'] as const;

// ========== Request DTOs ==========

export class EnviarNotificacionDto {
    @ApiProperty({ description: 'ID del usuario destinatario' })
    @IsUUID('4', { message: 'El usuarioId debe ser un UUID válido' })
    usuarioId!: string;

    @ApiProperty({
        description: 'Tipo de notificación',
        enum: TIPOS_NOTIFICACION,
        example: 'MANUAL',
    })
    @IsEnum(TIPOS_NOTIFICACION, {
        message: `El tipo debe ser uno de: ${TIPOS_NOTIFICACION.join(', ')}`,
    })
    tipo!: TipoNotificacion;

    @ApiPropertyOptional({
        description: 'Título personalizado (requerido para tipo MANUAL)',
        example: 'Información importante',
    })
    @ValidateIf((o) => o.tipo === 'MANUAL')
    @IsString({ message: 'El título debe ser una cadena de texto' })
    titulo?: string;

    @ApiPropertyOptional({
        description: 'Mensaje personalizado (requerido para tipo MANUAL)',
        example: 'Este es un mensaje de prueba',
    })
    @ValidateIf((o) => o.tipo === 'MANUAL')
    @IsString({ message: 'El mensaje debe ser una cadena de texto' })
    mensaje?: string;

    @ApiPropertyOptional({
        description: 'Datos adicionales para la notificación',
        example: { loteId: 'uuid', cantidad: 10 },
    })
    @IsOptional()
    @IsObject({ message: 'Los datos deben ser un objeto' })
    datos?: Record<string, unknown>;

    @ApiPropertyOptional({
        description: 'Canal de notificación',
        enum: CANALES_NOTIFICACION,
        default: 'WEBSOCKET',
    })
    @IsOptional()
    @IsEnum(CANALES_NOTIFICACION, {
        message: `El canal debe ser uno de: ${CANALES_NOTIFICACION.join(', ')}`,
    })
    canal?: CanalNotificacion;
}

export class QueryNotificacionesDto {
    @ApiPropertyOptional({
        description: 'Solo mostrar notificaciones no leídas',
        default: false,
    })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    soloNoLeidas?: boolean = false;

    @ApiPropertyOptional({
        description: 'Número de registros a saltar',
        default: 0,
        minimum: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'skip debe ser un número entero' })
    @Min(0, { message: 'skip debe ser mayor o igual a 0' })
    skip?: number = 0;

    @ApiPropertyOptional({
        description: 'Número de registros a obtener',
        default: 20,
        minimum: 1,
        maximum: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'take debe ser un número entero' })
    @Min(1, { message: 'take debe ser al menos 1' })
    @Max(100, { message: 'take no puede ser mayor a 100' })
    take?: number = 20;

    @ApiPropertyOptional({
        description: 'Filtrar por tipo de notificación',
        enum: TIPOS_NOTIFICACION,
    })
    @IsOptional()
    @IsEnum(TIPOS_NOTIFICACION, {
        message: `El tipo debe ser uno de: ${TIPOS_NOTIFICACION.join(', ')}`,
    })
    tipo?: TipoNotificacion;
}

export class MarcarTodasLeidasDto {
    @ApiPropertyOptional({
        description: 'Filtrar por tipo de notificación al marcar',
        enum: TIPOS_NOTIFICACION,
    })
    @IsOptional()
    @IsEnum(TIPOS_NOTIFICACION, {
        message: `El tipo debe ser uno de: ${TIPOS_NOTIFICACION.join(', ')}`,
    })
    tipo?: TipoNotificacion;
}

// ========== Response DTOs ==========

export class NotificacionResponseDto {
    @ApiProperty({
        description: 'ID de la notificación',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id!: string;

    @ApiProperty({
        description: 'ID del usuario destinatario',
        example: '550e8400-e29b-41d4-a716-446655440001',
    })
    usuarioId!: string;

    @ApiProperty({
        description: 'Tipo de notificación',
        enum: TIPOS_NOTIFICACION,
        example: 'CUADRE_PENDIENTE',
    })
    tipo!: TipoNotificacion;

    @ApiProperty({
        description: 'Título de la notificación',
        example: '💰 Cuadre Pendiente',
    })
    titulo!: string;

    @ApiProperty({
        description: 'Mensaje de la notificación',
        example: 'Tienes un cuadre pendiente por $50,000.',
    })
    mensaje!: string;

    @ApiPropertyOptional({
        description: 'Datos adicionales de la notificación',
        example: { cuadreId: 'uuid', montoEsperado: 50000 },
    })
    datos?: Record<string, unknown> | null;

    @ApiProperty({
        description: 'Canal por el que se envió la notificación',
        enum: CANALES_NOTIFICACION,
        example: 'WEBSOCKET',
    })
    canal!: CanalNotificacion;

    @ApiProperty({
        description: 'Indica si la notificación ha sido leída',
        example: false,
    })
    leida!: boolean;

    @ApiProperty({
        description: 'Fecha de creación de la notificación',
        example: '2025-01-30T10:00:00.000Z',
    })
    fechaCreacion!: Date;

    @ApiPropertyOptional({
        description: 'Fecha en que se marcó como leída',
        example: '2025-01-30T11:00:00.000Z',
    })
    fechaLeida?: Date | null;
}

export class NotificacionesPaginadasDto {
    @ApiProperty({
        description: 'Lista de notificaciones',
        type: [NotificacionResponseDto],
    })
    data!: NotificacionResponseDto[];

    @ApiProperty({
        description: 'Total de notificaciones que coinciden con el filtro',
        example: 42,
    })
    total!: number;

    @ApiProperty({
        description: 'Cantidad de notificaciones no leídas',
        example: 5,
    })
    noLeidas!: number;

    @ApiProperty({
        description: 'Indica si hay más notificaciones disponibles',
        example: true,
    })
    hasMore!: boolean;
}

export class ContadorNotificacionesDto {
    @ApiProperty({
        description: 'Cantidad de notificaciones no leídas',
        example: 5,
    })
    noLeidas!: number;
}

export class MarcarTodasLeidasResponseDto {
    @ApiProperty({
        description: 'Cantidad de notificaciones marcadas como leídas',
        example: 10,
    })
    marcadas!: number;
}