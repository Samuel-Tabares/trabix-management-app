export * from './crear-lote.command';
export * from './activar-lote.command';

import { CrearLoteHandler,ActivarLoteHandler } from '@/modules';

/**
 * Array de todos los command handlers del módulo lotes
 */
export const LoteCommandHandlers = [
  CrearLoteHandler,
  ActivarLoteHandler,
];
