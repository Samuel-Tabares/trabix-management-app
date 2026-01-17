import { Decimal } from 'decimal.js';
import { EstadoPedidoStock, PedidoStock, DetalleCostoPedido, ConfiguracionSistema, HistorialConfiguracion, TipoInsumo, StockAdmin } from '@prisma/client';

// ========== PedidoStock Repository ==========

export interface CreatePedidoStockData {
  cantidadTrabix: number;
  notas?: string;
}

export interface CreateDetalleCostoData {
  pedidoId: string;
  concepto: string;
  esObligatorio: boolean;
  cantidad?: number;
  costoTotal: Decimal;
}

export interface PedidoStockWithDetalles extends PedidoStock {
  detallesCosto: DetalleCostoPedido[];
}

export interface IPedidoStockRepository {
  findById(id: string): Promise<PedidoStockWithDetalles | null>;
  findAll(options?: { estado?: EstadoPedidoStock; skip?: number; take?: number }): Promise<{
    data: PedidoStockWithDetalles[];
    total: number;
    hasMore: boolean;
  }>;
  create(data: CreatePedidoStockData): Promise<PedidoStock>;
  agregarCosto(data: CreateDetalleCostoData): Promise<DetalleCostoPedido>;
  eliminarCosto(costoId: string): Promise<void>;
  confirmar(id: string, costoTotal: Decimal, costoRealPorTrabix: Decimal): Promise<PedidoStock>;
  recibir(id: string): Promise<PedidoStock>;
}

export const PEDIDO_STOCK_REPOSITORY = Symbol('PEDIDO_STOCK_REPOSITORY');

// ========== ConfiguracionSistema Repository ==========

export interface IConfiguracionRepository {
  findByClave(clave: string): Promise<ConfiguracionSistema | null>;
  findByCategoria(categoria: string): Promise<ConfiguracionSistema[]>;
  findAll(): Promise<ConfiguracionSistema[]>;
  actualizar(clave: string, valor: string, modificadoPorId: string): Promise<ConfiguracionSistema>;
  getHistorial(options?: { clave?: string; skip?: number; take?: number }): Promise<{
    data: HistorialConfiguracion[];
    total: number;
  }>;
  registrarHistorial(data: {
    clave: string;
    valorAnterior: string;
    valorNuevo: string;
    modificadoPorId: string;
    motivo?: string;
  }): Promise<HistorialConfiguracion>;
}

export const CONFIGURACION_REPOSITORY = Symbol('CONFIGURACION_REPOSITORY');

// ========== TipoInsumo Repository ==========

export interface CreateTipoInsumoData {
  nombre: string;
  esObligatorio?: boolean;
}

export interface ITipoInsumoRepository {
  findById(id: string): Promise<TipoInsumo | null>;
  findByNombre(nombre: string): Promise<TipoInsumo | null>;
  findAll(options?: { activo?: boolean }): Promise<TipoInsumo[]>;
  findObligatorios(): Promise<TipoInsumo[]>;
  create(data: CreateTipoInsumoData): Promise<TipoInsumo>;
  update(id: string, data: Partial<CreateTipoInsumoData>): Promise<TipoInsumo>;
  desactivar(id: string): Promise<TipoInsumo>;
}

export const TIPO_INSUMO_REPOSITORY = Symbol('TIPO_INSUMO_REPOSITORY');

// ========== StockAdmin Repository ==========

export interface IStockAdminRepository {
  get(): Promise<StockAdmin | null>;
  incrementarStock(cantidad: number, pedidoId: string): Promise<StockAdmin>;
  decrementarStock(cantidad: number): Promise<StockAdmin>;
  getStockReservado(): Promise<number>;
  getDeficit(): Promise<number>;
}

export const STOCK_ADMIN_REPOSITORY = Symbol('STOCK_ADMIN_REPOSITORY');
