export * from './cuadre-exitoso.event';
export * from './cuadre-exitoso.handler';

import { CuadreExitosoHandler } from '@modules/cuadres';

/**
 * Array de todos los event handlers del módulo cuadres
 */
export const CuadreEventHandlers = [
  CuadreExitosoHandler,
];
