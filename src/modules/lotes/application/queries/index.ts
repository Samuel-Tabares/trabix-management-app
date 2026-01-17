export * from './obtener-lote.query';
export * from './listar-lotes.query';
export * from './resumen-financiero.query';

import { ObtenerLoteHandler, ListarLotesHandler, ResumenFinancieroHandler, } from '@/modules';

/**
 * Array de todos los query handlers del módulo lotes
 */
export const LoteQueryHandlers = [
  ObtenerLoteHandler,
  ListarLotesHandler,
  ResumenFinancieroHandler,
];
