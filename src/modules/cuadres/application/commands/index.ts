export * from './confirmar-cuadre.command';
export * from './activar-cuadre.command';

import { ConfirmarCuadreHandler } from './confirmar-cuadre.command';
import { ActivarCuadreHandler } from './activar-cuadre.command';

/**
 * Array de todos los command handlers del módulo cuadres
 */
export const CuadreCommandHandlers = [
  ConfirmarCuadreHandler,
  ActivarCuadreHandler,
];
