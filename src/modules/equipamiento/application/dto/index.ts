import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { EstadoEquipamiento } from '@prisma/client';

// ========== Request DTOs ==========

export class SolicitarEquipamientoDto {
  @ApiProperty({ description: 'Si incluye depósito inicial' })
  @IsBoolean()
  tieneDeposito!: boolean;
}

export class ReportarDanoDto {
  @ApiProperty({ description: 'Tipo de daño', enum: ['NEVERA', 'PIJAMA'] })
  @IsEnum(['NEVERA', 'PIJAMA'])
  tipoDano!: 'NEVERA' | 'PIJAMA';
}

export class QueryEquipamientosDto {
  @ApiPropertyOptional({ description: 'Filtrar por estado' })
  @IsOptional()
  @IsEnum(['SOLICITADO', 'ACTIVO', 'DEVUELTO', 'DANADO', 'PERDIDO'])
  estado?: EstadoEquipamiento;

  @ApiPropertyOptional({ description: 'Filtrar por vendedor' })
  @IsOptional()
  @IsUUID()
  vendedorId?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  skip?: number = 0;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  take?: number = 20;
}

// ========== Response DTOs ==========

export class EquipamientoResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  vendedorId!: string;

  @ApiProperty({ enum: ['SOLICITADO', 'ACTIVO', 'DEVUELTO', 'DANADO', 'PERDIDO'] })
  estado!: EstadoEquipamiento;

  @ApiProperty()
  tieneDeposito!: boolean;

  @ApiPropertyOptional()
  depositoPagado?: number | null;

  @ApiProperty()
  mensualidadActual!: number;

  @ApiPropertyOptional()
  ultimaMensualidadPagada?: Date | null;

  @ApiProperty()
  deudaDano!: number;

  @ApiProperty()
  deudaPerdida!: number;

  @ApiProperty()
  fechaSolicitud!: Date;

  @ApiPropertyOptional()
  fechaEntrega?: Date | null;

  @ApiPropertyOptional()
  fechaDevolucion?: Date | null;

  @ApiProperty()
  depositoDevuelto!: boolean;

  @ApiPropertyOptional()
  fechaDevolucionDeposito?: Date | null;

  @ApiProperty()
  mensualidadAlDia!: boolean;

  @ApiProperty()
  deudaTotal!: number;
}

export class EquipamientosPaginadosDto {
  @ApiProperty({ type: [EquipamientoResponseDto] })
  data!: EquipamientoResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  hasMore!: boolean;
}
