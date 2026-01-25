export * from './obtener-lote.query';
export * from './listar-lotes.query';
export * from './listar-mis-lotes.query';
export * from './obtener-info-solicitud.query';
export * from './resumen-financiero.query';

import { ObtenerLoteHandler } from './obtener-lote.query';
import { ListarLotesHandler } from './listar-lotes.query';
import { ListarMisLotesHandler } from './listar-mis-lotes.query';
import { ObtenerInfoSolicitudHandler } from './obtener-info-solicitud.query';
import { ResumenFinancieroHandler } from './resumen-financiero.query';

/**
 * Array de todos los query handlers del módulo lotes
 */
export const LoteQueryHandlers = [
  ObtenerLoteHandler,
  ListarLotesHandler,
  ListarMisLotesHandler,
  ObtenerInfoSolicitudHandler,
  ResumenFinancieroHandler,
];
