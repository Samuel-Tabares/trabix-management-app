export * from './confirmar-cuadre.command';
export * from './activar-cuadre.command';

import { ConfirmarCuadreHandler,ActivarCuadreHandler } from '@modules/cuadres';

/**
 * Array de todos los command handlers del módulo cuadres
 */
export const CuadreCommandHandlers = [
  ConfirmarCuadreHandler,
  ActivarCuadreHandler,
];
