import { Cuadre, EstadoCuadre, ConceptoCuadre, Prisma } from '@prisma/client';
import { IVersionedRepository } from './base.repository.interface';
import { PaginationOptions, PaginatedResponse } from '../../shared/interfaces/paginated.interface';
import { Decimal } from 'decimal.js';

/**
 * Tipos para creación y actualización de Cuadre
 */
export type CreateCuadreInput = Prisma.CuadreCreateInput;
export type UpdateCuadreInput = Prisma.CuadreUpdateInput;

/**
 * Cuadre con relaciones cargadas
 */
export interface CuadreConRelaciones extends Cuadre {
  tanda: {
    id: string;
    numero: number;
    loteId: string;
    lote: {
      id: string;
      vendedorId: string;
      cantidadTrabix: number;
    };
  };
}

/**
 * Filtros para búsqueda de cuadres
 */
export interface CuadreFilters {
  vendedorId?: string;
  loteId?: string;
  estado?: EstadoCuadre;
  concepto?: ConceptoCuadre;
}

/**
 * Interface del repositorio de Cuadres
 * Según sección 8 y 17.6 del documento
 */
export interface ICuadreRepository extends IVersionedRepository<Cuadre, CreateCuadreInput, UpdateCuadreInput> {
  /**
   * Busca cuadre por tanda
   */
  findByTanda(tandaId: string): Promise<Cuadre | null>;

  /**
   * Busca cuadres por lote
   */
  findByLote(loteId: string): Promise<Cuadre[]>;

  /**
   * Busca cuadres pendientes
   */
  findPendientes(): Promise<Cuadre[]>;

  /**
   * Busca cuadres pendientes de un vendedor
   */
  findPendientesByVendedor(vendedorId: string): Promise<Cuadre[]>;

  /**
   * Busca cuadres con filtros y paginación
   */
  findWithFilters(
    filters: CuadreFilters,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Cuadre>>;

  /**
   * Obtiene un cuadre con sus relaciones
   */
  findByIdWithRelations(id: string): Promise<CuadreConRelaciones | null>;

  /**
   * Activa un cuadre (INACTIVO → PENDIENTE)
   */
  activar(id: string, version: number): Promise<Cuadre>;

  /**
   * Marca cuadre como exitoso (PENDIENTE → EXITOSO)
   */
  marcarExitoso(id: string, version: number, montoRecibido: Decimal): Promise<Cuadre>;

  /**
   * Marca cuadre como cerrado por cuadre al mayor
   */
  cerrarPorCuadreMayor(
    id: string,
    version: number,
    cuadreMayorId: string,
    montoCubierto: Decimal,
  ): Promise<Cuadre>;

  /**
   * Actualiza el monto esperado
   */
  updateMontoEsperado(id: string, version: number, monto: Decimal): Promise<Cuadre>;

  /**
   * Calcula el monto total pendiente de un vendedor
   */
  sumMontoPendienteByVendedor(vendedorId: string): Promise<Decimal>;
}
