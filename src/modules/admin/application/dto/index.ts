import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, Min } from 'class-validator';
import { EstadoPedidoStock } from '@prisma/client';

// ========== Pedido Stock DTOs ==========

export class CrearPedidoStockDto {
  @ApiProperty({ description: 'Cantidad de TRABIX a pedir' })
  @IsNumber()
  @Min(1)
  cantidadTrabix!: number;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notas?: string;
}

export class AgregarCostoDto {
  @ApiProperty({ description: 'Concepto del costo' })
  @IsString()
  concepto!: string;

  @ApiProperty({ description: 'Si es insumo obligatorio' })
  @IsBoolean()
  esObligatorio!: boolean;

  @ApiPropertyOptional({ description: 'Cantidad (si aplica)' })
  @IsOptional()
  @IsNumber()
  cantidad?: number;

  @ApiProperty({ description: 'Costo total de este concepto' })
  @IsNumber()
  @Min(0)
  costoTotal!: number;
}

export class QueryPedidosDto {
  @ApiPropertyOptional({ enum: ['BORRADOR', 'CONFIRMADO', 'RECIBIDO'] })
  @IsOptional()
  @IsEnum(['BORRADOR', 'CONFIRMADO', 'RECIBIDO'])
  estado?: EstadoPedidoStock;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  skip?: number = 0;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  take?: number = 20;
}

export class DetalleCostoResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  concepto!: string;

  @ApiProperty()
  esObligatorio!: boolean;

  @ApiPropertyOptional()
  cantidad?: number | null;

  @ApiProperty()
  costoTotal!: number;

  @ApiProperty()
  fechaRegistro!: Date;
}

export class PedidoStockResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  cantidadTrabix!: number;

  @ApiProperty({ enum: ['BORRADOR', 'CONFIRMADO', 'RECIBIDO'] })
  estado!: EstadoPedidoStock;

  @ApiProperty()
  costoTotal!: number;

  @ApiProperty()
  costoRealPorTrabix!: number;

  @ApiProperty({ type: [DetalleCostoResponseDto] })
  detallesCosto!: DetalleCostoResponseDto[];

  @ApiProperty()
  fechaCreacion!: Date;

  @ApiPropertyOptional()
  notas?: string | null;
}

// ========== Configuracion DTOs ==========

export class ModificarConfiguracionDto {
  @ApiProperty({ description: 'Nuevo valor' })
  @IsString()
  valor!: string;

  @ApiPropertyOptional({ description: 'Motivo del cambio' })
  @IsOptional()
  @IsString()
  motivo?: string;
}

export class ConfiguracionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  clave!: string;

  @ApiProperty()
  valor!: string;

  @ApiProperty()
  tipo!: string;

  @ApiProperty()
  descripcion!: string;

  @ApiProperty()
  categoria!: string;

  @ApiProperty()
  modificable!: boolean;

  @ApiProperty()
  ultimaModificacion!: Date;
}

export class HistorialConfiguracionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  clave!: string;

  @ApiProperty()
  valorAnterior!: string;

  @ApiProperty()
  valorNuevo!: string;

  @ApiProperty()
  modificadoPorId!: string;

  @ApiPropertyOptional()
  motivo?: string | null;

  @ApiProperty()
  fechaCambio!: Date;
}

// ========== TipoInsumo DTOs ==========

export class CrearTipoInsumoDto {
  @ApiProperty({ description: 'Nombre del tipo de insumo' })
  @IsString()
  nombre!: string;

  @ApiPropertyOptional({ description: 'Si es obligatorio', default: false })
  @IsOptional()
  @IsBoolean()
  esObligatorio?: boolean;
}

export class ModificarTipoInsumoDto {
  @ApiPropertyOptional({ description: 'Nombre del tipo de insumo' })
  @IsOptional()
  @IsString()
  nombre?: string;
}

export class TipoInsumoResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nombre!: string;

  @ApiProperty()
  esObligatorio!: boolean;

  @ApiProperty()
  activo!: boolean;

  @ApiProperty()
  fechaCreacion!: Date;
}

// ========== StockAdmin DTOs ==========

export class StockAdminResponseDto {
  @ApiProperty({ description: 'Stock físico actual' })
  stockFisico!: number;

  @ApiPropertyOptional({ description: 'ID del último pedido' })
  ultimoPedidoId?: string | null;

  @ApiProperty()
  ultimaActualizacion!: Date;
}

export class DeficitResponseDto {
  @ApiProperty({ description: 'Stock físico actual' })
  stockFisico!: number;

  @ApiProperty({ description: 'Stock reservado (comprometido)' })
  stockReservado!: number;

  @ApiProperty({ description: 'Déficit (si > 0)' })
  deficit!: number;

  @ApiProperty({ description: 'Si hay déficit' })
  hayDeficit!: boolean;
}

export class StockReservadoDetalleDto {
  @ApiProperty()
  loteId!: string;

  @ApiProperty()
  vendedorNombre!: string;

  @ApiProperty()
  cantidadReservada!: number;

  @ApiProperty()
  tandaNumero!: number;
}

// ========== Dashboard DTOs ==========

export class ResumenDashboardDto {
  @ApiProperty({ description: 'Total de ventas del día' })
  ventasHoy!: number;

  @ApiProperty({ description: 'Ingresos del día' })
  ingresosHoy!: number;

  @ApiProperty({ description: 'Stock físico actual' })
  stockFisico!: number;

  @ApiProperty({ description: 'Cuadres pendientes de confirmar' })
  cuadresPendientes!: number;

  @ApiProperty({ description: 'Vendedores activos' })
  vendedoresActivos!: number;

  @ApiProperty({ description: 'Saldo del fondo de recompensas' })
  saldoFondo!: number;
}

export class VentasPeriodoDto {
  @ApiProperty({ description: 'Período consultado' })
  periodo!: string;

  @ApiProperty({ description: 'Total de ventas' })
  totalVentas!: number;

  @ApiProperty({ description: 'Total de ingresos' })
  totalIngresos!: number;

  @ApiProperty({ description: 'Cantidad de TRABIX vendidos' })
  trabixVendidos!: number;
}

export class CuadrePendienteResumenDto {
  @ApiProperty()
  cuadreId!: string;

  @ApiProperty()
  tandaId!: string;

  @ApiProperty()
  numeroTanda!: number;

  @ApiProperty()
  vendedorNombre!: string;

  @ApiProperty()
  montoEsperado!: number;

  @ApiProperty()
  fechaPendiente!: Date;
}
