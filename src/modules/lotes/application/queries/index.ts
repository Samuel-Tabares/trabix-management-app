export * from './obtener-lote.query';
export * from './listar-lotes.query';
export * from './resumen-financiero.query';

import { ObtenerLoteHandler } from './obtener-lote.query';
import { ListarLotesHandler } from './listar-lotes.query';
import { ResumenFinancieroHandler } from './resumen-financiero.query';

/**
 * Array de todos los query handlers del módulo lotes
 */
export const LoteQueryHandlers = [
  ObtenerLoteHandler,
  ListarLotesHandler,
  ResumenFinancieroHandler,
];
