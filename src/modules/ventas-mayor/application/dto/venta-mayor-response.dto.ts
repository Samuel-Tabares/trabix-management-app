import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModalidadVentaMayor, EstadoVentaMayor } from '@prisma/client';

/**
 * DTO de fuente de stock
 */
export class FuenteStockResponseDto {
  @ApiProperty()
  tandaId!: string;

  @ApiProperty()
  cantidadConsumida!: number;

  @ApiProperty({ enum: ['RESERVADO', 'EN_CASA', 'LOTE_FORZADO'] })
  tipoStock!: string;
}

/**
 * DTO de respuesta para venta al mayor
 */
export class VentaMayorResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  vendedorId!: string;

  @ApiProperty()
  cantidadUnidades!: number;

  @ApiProperty()
  precioUnidad!: number;

  @ApiProperty()
  ingresoBruto!: number;

  @ApiProperty()
  conLicor!: boolean;

  @ApiProperty({ enum: ['ANTICIPADO', 'CONTRAENTREGA'] })
  modalidad!: ModalidadVentaMayor;

  @ApiProperty({ enum: ['PENDIENTE', 'COMPLETADA'] })
  estado!: EstadoVentaMayor;

  @ApiProperty({ type: [FuenteStockResponseDto] })
  fuentesStock!: FuenteStockResponseDto[];

  @ApiProperty({ type: [String] })
  lotesInvolucradosIds!: string[];

  @ApiPropertyOptional()
  loteForzadoId?: string | null;

  @ApiPropertyOptional()
  cuadreMayorId?: string | null;

  @ApiProperty()
  fechaRegistro!: Date;

  @ApiPropertyOptional()
  fechaCompletada?: Date | null;
}

/**
 * DTO para lista paginada de ventas al mayor
 */
export class VentasMayorPaginadasDto {
  @ApiProperty({ type: [VentaMayorResponseDto] })
  data!: VentaMayorResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  hasMore!: boolean;

  @ApiPropertyOptional()
  nextCursor?: string;
}

/**
 * DTO de stock disponible para venta al mayor
 */
export class StockDisponibleResponseDto {
  @ApiProperty({ description: 'Stock en tandas inactivas (reservado)' })
  stockReservado!: number;

  @ApiProperty({ description: 'Stock en tandas EN_CASA' })
  stockEnCasa!: number;

  @ApiProperty({ description: 'Stock total disponible' })
  stockTotal!: number;

  @ApiProperty({ description: 'Cantidad máxima para venta al mayor sin lote forzado' })
  cantidadMaximaSinLoteForzado!: number;
}
