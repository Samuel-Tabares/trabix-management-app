import { IQuery } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Clase base para todas las Queries del sistema
 * 
 * Las Queries representan solicitudes de lectura de datos.
 * No modifican el estado del sistema.
 * 
 * Convenciones:
 * - Nombrar descriptivamente: ObtenerLoteQuery, ListarVentasQuery
 * - Deben ser serializables
 * - Pueden incluir filtros, paginación, ordenamiento
 */
export abstract class BaseQuery implements IQuery {
  /**
   * ID único de la query para trazabilidad
   */
  readonly queryId: string;

  /**
   * Timestamp de cuando se creó la query
   */
  readonly timestamp: Date;

  /**
   * ID del usuario que ejecuta la query (para filtrado por permisos)
   */
  readonly userId?: string;

  constructor(userId?: string) {
    this.queryId = uuidv4();
    this.timestamp = new Date();
    this.userId = userId;
  }

  /**
   * Nombre de la query para logging
   */
  abstract get queryName(): string;
}

/**
 * Interfaz para Query Handlers con resultado tipado
 */
export interface ITypedQueryHandler<TQuery extends IQuery, TResult> {
  execute(query: TQuery): Promise<TResult>;
}

/**
 * Parámetros de paginación estándar
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Parámetros de ordenamiento estándar
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Resultado paginado estándar
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Query base con paginación
 */
export abstract class PaginatedQuery extends BaseQuery {
  readonly page: number;
  readonly limit: number;

  constructor(
    pagination: PaginationParams = {},
    userId?: string,
  ) {
    super(userId);
    this.page = pagination.page ?? 1;
    this.limit = Math.min(pagination.limit ?? 10, 100); // Máximo 100 items
  }

  get offset(): number {
    return (this.page - 1) * this.limit;
  }
}

/**
 * Helper para crear resultado paginado
 */
export function createPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
