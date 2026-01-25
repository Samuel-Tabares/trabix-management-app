import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsEnum, IsUUID, Min } from 'class-validator';

// ========== Request DTOs ==========

/**
 * DTO para registrar una salida del fondo (premio/bono a vendedor)
 */
export class RegistrarSalidaDto {
  @ApiProperty({ description: 'Monto de la salida', example: 50000 })
  @IsNumber()
  @Min(1, { message: 'El monto debe ser mayor a 0' })
  monto!: number;

  @ApiProperty({ 
    description: 'Concepto/motivo de la salida', 
    example: 'Premio vendedor del mes - Enero 2025' 
  })
  @IsString()
  concepto!: string;

  @ApiProperty({ 
    description: 'ID del vendedor beneficiario del premio',
    example: 'uuid-del-vendedor'
  })
  @IsUUID('4', { message: 'El ID del vendedor debe ser un UUID válido' })
  vendedorBeneficiarioId!: string;
}

/**
 * DTO para filtrar transacciones
 */
export class QueryTransaccionesDto {
  @ApiPropertyOptional({ 
    description: 'Filtrar por tipo de movimiento', 
    enum: ['ENTRADA', 'SALIDA'] 
  })
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

/**
 * DTO de respuesta para saldo del fondo
 */
export class SaldoFondoResponseDto {
  @ApiProperty({ description: 'Saldo actual del fondo', example: 1500000 })
  saldo!: number;
}

/**
 * DTO de respuesta para un movimiento del fondo
 */
export class MovimientoFondoResponseDto {
  @ApiProperty({ description: 'ID del movimiento' })
  id!: string;

  @ApiProperty({ enum: ['ENTRADA', 'SALIDA'], description: 'Tipo de movimiento' })
  tipo!: 'ENTRADA' | 'SALIDA';

  @ApiProperty({ description: 'Monto del movimiento', example: 50000 })
  monto!: number;

  @ApiProperty({ description: 'Concepto del movimiento' })
  concepto!: string;

  @ApiPropertyOptional({ description: 'ID del lote (solo para entradas)' })
  loteId?: string;

  @ApiPropertyOptional({ description: 'ID del vendedor beneficiario (solo para salidas/premios)' })
  vendedorBeneficiarioId?: string;

  @ApiProperty({ description: 'Fecha de la transacción' })
  fechaTransaccion!: Date;
}

/**
 * DTO de respuesta paginada de transacciones
 */
export class TransaccionesPaginadasDto {
  @ApiProperty({ type: [MovimientoFondoResponseDto] })
  data!: MovimientoFondoResponseDto[];

  @ApiProperty({ description: 'Total de transacciones' })
  total!: number;

  @ApiProperty({ description: 'Indica si hay más resultados' })
  hasMore!: boolean;
}
