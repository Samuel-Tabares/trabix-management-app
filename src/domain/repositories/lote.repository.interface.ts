import { Lote, EstadoLote, ModeloNegocio, Prisma } from '@prisma/client';
import { IVersionedRepository } from './base.repository.interface';
import { PaginationOptions, PaginatedResponse } from '../../shared/interfaces/paginated.interface';
import { Decimal } from 'decimal.js';

/**
 * Tipos para creación y actualización de Lote
 */
export type CreateLoteInput = Prisma.LoteCreateInput;
export type UpdateLoteInput = Prisma.LoteUpdateInput;

/**
 * Lote con relaciones cargadas
 */
export interface LoteConRelaciones extends Lote {
  vendedor?: {
    id: string;
    nombre: string;
    apellidos: string;
    reclutadorId: string | null;
  };
  tandas?: Array<{
    id: string;
    numero: number;
    estado: string;
    stockInicial: number;
    stockActual: number;
  }>;
}

/**
 * Filtros para búsqueda de lotes
 */
export interface LoteFilters {
  vendedorId?: string;
  estado?: EstadoLote;
  modeloNegocio?: ModeloNegocio;
  esLoteForzado?: boolean;
}

/**
 * Interface del repositorio de Lotes
 * Según sección 3 y 17.2 del documento
 */
export interface ILoteRepository extends IVersionedRepository<Lote, CreateLoteInput, UpdateLoteInput> {
  /**
   * Busca lotes por vendedor
   */
  findByVendedor(vendedorId: string): Promise<Lote[]>;

  /**
   * Busca lotes activos de un vendedor ordenados por fecha (más antiguo primero)
   * Según sección 3.4: Las ventas consumen siempre el lote activo más antiguo
   */
  findLotesActivosByVendedor(vendedorId: string): Promise<Lote[]>;

  /**
   * Busca el lote activo más antiguo de un vendedor
   */
  findLoteActivoMasAntiguo(vendedorId: string): Promise<Lote | null>;

  /**
   * Busca lotes con filtros y paginación
   */
  findWithFilters(
    filters: LoteFilters,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Lote>>;

  /**
   * Obtiene un lote con sus relaciones
   */
  findByIdWithRelations(id: string): Promise<LoteConRelaciones | null>;

  /**
   * Activa un lote (CREADO → ACTIVO)
   */
  activar(id: string): Promise<Lote>;

  /**
   * Finaliza un lote (ACTIVO → FINALIZADO)
   */
  finalizar(id: string): Promise<Lote>;

  /**
   * Incrementa el dinero recaudado del lote
   */
  incrementarDineroRecaudado(id: string, version: number, monto: Decimal): Promise<Lote>;

  /**
   * Incrementa el dinero transferido del lote
   */
  incrementarDineroTransferido(id: string, version: number, monto: Decimal): Promise<Lote>;

  /**
   * Cuenta lotes por estado de un vendedor
   */
  countByEstado(vendedorId: string, estado: EstadoLote): Promise<number>;

  /**
   * Obtiene el resumen financiero de un lote
   */
  getResumenFinanciero(id: string): Promise<{
    inversionTotal: Decimal;
    inversionAdmin: Decimal;
    inversionVendedor: Decimal;
    dineroRecaudado: Decimal;
    dineroTransferido: Decimal;
    gananciaBruta: Decimal;
  }>;
}
