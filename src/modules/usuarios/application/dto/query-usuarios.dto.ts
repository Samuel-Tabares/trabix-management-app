import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Rol, EstadoUsuario } from '@prisma/client';

/**
 * DTO para consultar usuarios con filtros y paginación
 * Soporta cursor pagination según sección 20.14
 */
export class QueryUsuariosDto {
  @ApiPropertyOptional({
    description: 'Búsqueda por nombre, apellidos, email o cédula',
    example: 'juan',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por rol',
    enum: ['ADMIN', 'VENDEDOR', 'RECLUTADOR'],
  })
  @IsOptional()
  @IsEnum(['ADMIN', 'VENDEDOR', 'RECLUTADOR'])
  rol?: Rol;

  @ApiPropertyOptional({
    description: 'Filtrar por estado',
    enum: ['ACTIVO', 'INACTIVO'],
  })
  @IsOptional()
  @IsEnum(['ACTIVO', 'INACTIVO'])
  estado?: EstadoUsuario;

  @ApiPropertyOptional({
    description: 'Filtrar por reclutador',
    example: 'uuid-del-reclutador',
  })
  @IsOptional()
  @IsUUID('4')
  reclutadorId?: string;

  @ApiPropertyOptional({
    description: 'Número de registros a saltar (offset)',
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @ApiPropertyOptional({
    description: 'Número de registros a retornar',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number = 20;

  @ApiPropertyOptional({
    description: 'Cursor para paginación (ID del último elemento)',
    example: 'uuid-del-ultimo-elemento',
  })
  @IsOptional()
  @IsUUID('4')
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Campo para ordenar',
    enum: ['fechaCreacion', 'nombre', 'apellidos', 'email'],
    default: 'fechaCreacion',
  })
  @IsOptional()
  @IsEnum(['fechaCreacion', 'nombre', 'apellidos', 'email'])
  orderBy?: 'fechaCreacion' | 'nombre' | 'apellidos' | 'email' = 'fechaCreacion';

  @ApiPropertyOptional({
    description: 'Dirección del ordenamiento',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  orderDirection?: 'asc' | 'desc' = 'desc';
}
