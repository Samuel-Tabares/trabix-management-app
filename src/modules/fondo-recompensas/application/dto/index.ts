import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsEnum, Min } from 'class-validator';

// ========== Request DTOs ==========

export class RegistrarSalidaDto {
  @ApiProperty({ description: 'Monto de la salida' })
  @IsNumber()
  @Min(1)
  monto!: number;

  @ApiProperty({ description: 'Concepto/motivo de la salida' })
  @IsString()
  concepto!: string;
}

export class QueryTransaccionesDto {
  @ApiPropertyOptional({ description: 'Filtrar por tipo', enum: ['ENTRADA', 'SALIDA'] })
  @IsOptional()
  @IsEnum(['ENTRADA', 'SALIDA'])
  tipo?: 'ENTRADA' | 'SALIDA';

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  skip?: number = 0;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  take?: number = 20;
}

// ========== Response DTOs ==========

export class SaldoFondoResponseDto {
  @ApiProperty({ description: 'Saldo actual del fondo' })
  saldo!: number;
}

export class MovimientoFondoResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['ENTRADA', 'SALIDA'] })
  tipo!: 'ENTRADA' | 'SALIDA';

  @ApiProperty()
  monto!: number;

  @ApiProperty()
  concepto!: string;

  @ApiPropertyOptional()
  loteId?: string;

  @ApiProperty()
  fechaTransaccion!: Date;
}

export class TransaccionesPaginadasDto {
  @ApiProperty({ type: [MovimientoFondoResponseDto] })
  data!: MovimientoFondoResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  hasMore!: boolean;
}
