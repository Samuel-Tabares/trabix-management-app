export * from './obtener-cuadre.query';
export * from './listar-cuadres.query';

import { ObtenerCuadreHandler, ListarCuadresHandler } from '@modules/cuadres';

/**
 * Array de todos los query handlers del módulo cuadres
 */
export const CuadreQueryHandlers = [
  ObtenerCuadreHandler,
  ListarCuadresHandler,
];
