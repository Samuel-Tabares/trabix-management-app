export * from './lote-activado.event';
export * from './lote-activado.handler';

import { LoteActivadoHandler } from '@/modules';

/**
 * Array de todos los event handlers del módulo lotes
 */
export const LoteEventHandlers = [
  LoteActivadoHandler,
];
