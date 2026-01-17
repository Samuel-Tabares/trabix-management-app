import { Venta, EstadoVenta, Prisma } from '@prisma/client';
import { IBaseRepository } from './base.repository.interface';
import { PaginationOptions, PaginatedResponse } from '../../shared/interfaces/paginated.interface';
import { Decimal } from 'decimal.js';

/**
 * Tipos para creación y actualización de Venta
 */
export type CreateVentaInput = Prisma.VentaCreateInput;
export type UpdateVentaInput = Prisma.VentaUpdateInput;

/**
 * Venta con detalles cargados
 */
export interface VentaConDetalles extends Venta {
  detalles: Array<{
    id: string;
    tipo: string;
    cantidad: number;
    precioUnitario: Decimal;
    subtotal: Decimal;
  }>;
}

/**
 * Filtros para búsqueda de ventas
 */
export interface VentaFilters {
  vendedorId?: string;
  loteId?: string;
  tandaId?: string;
  estado?: EstadoVenta;
  fechaDesde?: Date;
  fechaHasta?: Date;
}

/**
 * Interface del repositorio de Ventas
 * Según sección 6 y 17.4 del documento
 */
export interface IVentaRepository extends IBaseRepository<Venta, CreateVentaInput, UpdateVentaInput> {
  /**
   * Busca ventas por vendedor
   */
  findByVendedor(vendedorId: string): Promise<Venta[]>;

  /**
   * Busca ventas por lote
   */
  findByLote(loteId: string): Promise<Venta[]>;

  /**
   * Busca ventas por tanda
   */
  findByTanda(tandaId: string): Promise<Venta[]>;

  /**
   * Busca ventas con filtros y paginación
   */
  findWithFilters(
    filters: VentaFilters,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Venta>>;

  /**
   * Obtiene una venta con sus detalles
   */
  findByIdWithDetalles(id: string): Promise<VentaConDetalles | null>;

  /**
   * Aprueba una venta (PENDIENTE → APROBADA)
   */
  aprobar(id: string): Promise<Venta>;

  /**
   * Rechaza y elimina una venta (hard delete según sección 18.5)
   */
  rechazarYEliminar(id: string): Promise<void>;

  /**
   * Cuenta regalos en un lote (para validar límite del 8%)
   */
  countRegalosByLote(loteId: string): Promise<number>;

  /**
   * Calcula el monto total recaudado de ventas aprobadas en un lote
   */
  sumMontoAprobadoByLote(loteId: string): Promise<Decimal>;

  /**
   * Calcula el monto total recaudado de ventas aprobadas en una tanda
   */
  sumMontoAprobadoByTanda(tandaId: string): Promise<Decimal>;

  /**
   * Cuenta ventas pendientes de un vendedor
   */
  countPendientesByVendedor(vendedorId: string): Promise<number>;
}
