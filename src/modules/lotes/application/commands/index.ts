export * from './crear-lote.command';
export * from './solicitar-lote.command';
export * from './cancelar-lote.command';
export * from './activar-lote.command';

import { CrearLoteHandler } from './crear-lote.command';
import { SolicitarLoteHandler } from './solicitar-lote.command';
import { CancelarLoteHandler } from './cancelar-lote.command';
import { ActivarLoteHandler } from './activar-lote.command';

/**
 * Array de todos los command handlers del módulo lotes
 */
export const LoteCommandHandlers = [
  CrearLoteHandler,
  SolicitarLoteHandler,
  CancelarLoteHandler,
  ActivarLoteHandler,
];
