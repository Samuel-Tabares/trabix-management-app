import { PaginationOptions, PaginatedResponse } from '../../shared/interfaces/paginated.interface';

/**
 * Interface base para repositorios
 * Patrón Repository según sección 18.3
 * 
 * @template T - Tipo de la entidad
 * @template CreateInput - Tipo para creación
 * @template UpdateInput - Tipo para actualización
 */
export interface IBaseRepository<T, CreateInput, UpdateInput> {
  /**
   * Crea una nueva entidad
   */
  create(data: CreateInput): Promise<T>;

  /**
   * Busca una entidad por ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Busca una entidad por ID o lanza excepción
   */
  findByIdOrFail(id: string): Promise<T>;

  /**
   * Busca todas las entidades
   */
  findAll(): Promise<T[]>;

  /**
   * Busca entidades con paginación
   */
  findPaginated(options: PaginationOptions): Promise<PaginatedResponse<T>>;

  /**
   * Actualiza una entidad
   */
  update(id: string, data: UpdateInput): Promise<T>;

  /**
   * Elimina una entidad (soft delete cuando aplique)
   */
  delete(id: string): Promise<void>;

  /**
   * Verifica si existe una entidad por ID
   */
  exists(id: string): Promise<boolean>;

  /**
   * Cuenta el total de entidades
   */
  count(): Promise<number>;
}

/**
 * Interface para repositorios con versionamiento optimista
 * Según sección 18.4 - Control de concurrencia
 */
export interface IVersionedRepository<T, CreateInput, UpdateInput> 
  extends IBaseRepository<T, CreateInput, UpdateInput> {
  /**
   * Actualiza una entidad verificando la versión
   * Lanza ConflictException si la versión no coincide
   */
  updateWithVersion(id: string, version: number, data: UpdateInput): Promise<T>;
}
