export * from './crear-lote.command';
export * from './activar-lote.command';

import { CrearLoteHandler } from './crear-lote.command';
import { ActivarLoteHandler } from './activar-lote.command';

/**
 * Array de todos los command handlers del módulo lotes
 */
export const LoteCommandHandlers = [
  CrearLoteHandler,
  ActivarLoteHandler,
];
