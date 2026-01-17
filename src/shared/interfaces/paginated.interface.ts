/**
 * Opciones de paginación cursor-based
 * Según sección 20.14 del documento
 */
export interface PaginationOptions {
  /**
   * Número de items por página
   * Default: 20, Max: 100
   */
  limit?: number;

  /**
   * ID del último item de la página anterior
   * Usado para cursor-based pagination
   */
  cursor?: string;
}

/**
 * Metadatos de paginación
 */
export interface PaginationMeta {
  /**
   * Indica si hay más items disponibles
   */
  hasMore: boolean;

  /**
   * Cursor para la siguiente página
   * Es el ID del último item de la página actual
   */
  nextCursor: string | null;
}

/**
 * Respuesta paginada genérica
 */
export interface PaginatedResponse<T> {
  /**
   * Array de items
   */
  data: T[];

  /**
   * Metadatos de paginación
   */
  pagination: PaginationMeta;
}

/**
 * Valores por defecto de paginación
 */
export const PAGINATION_DEFAULTS = {
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * Valida y normaliza las opciones de paginación
 */
export function normalizePaginationOptions(
  options: PaginationOptions,
): Required<Omit<PaginationOptions, 'cursor'>> & { cursor?: string } {
  const limit = Math.min(
    Math.max(options.limit || PAGINATION_DEFAULTS.LIMIT, 1),
    PAGINATION_DEFAULTS.MAX_LIMIT,
  );

  return {
    limit,
    cursor: options.cursor,
  };
}
