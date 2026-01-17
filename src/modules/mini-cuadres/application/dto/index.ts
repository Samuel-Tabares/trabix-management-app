import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoMiniCuadre } from '@prisma/client';

/**
 * DTO de respuesta para mini-cuadre
 */
export class MiniCuadreResponseDto {
  @ApiProperty({ description: 'ID del mini-cuadre' })
  id!: string;

  @ApiProperty({ description: 'ID del lote asociado' })
  loteId!: string;

  @ApiProperty({ description: 'ID de la última tanda' })
  tandaId!: string;

  @ApiProperty({
    description: 'Estado del mini-cuadre',
    enum: ['INACTIVO', 'PENDIENTE', 'EXITOSO'],
  })
  estado!: EstadoMiniCuadre;

  @ApiProperty({ description: 'Monto final (ganancias restantes)' })
  montoFinal!: number;

  @ApiPropertyOptional({ description: 'Fecha en que pasó a PENDIENTE' })
  fechaPendiente?: Date | null;

  @ApiPropertyOptional({ description: 'Fecha en que pasó a EXITOSO' })
  fechaExitoso?: Date | null;

  @ApiPropertyOptional({ description: 'Información del lote asociado' })
  lote?: {
    id: string;
    vendedorId: string;
    estado: string;
    cantidadTrabix: number;
  };
}
