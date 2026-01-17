export * from './registrar-venta.command';
export * from './aprobar-venta.command';
export * from './rechazar-venta.command';

import { AprobarVentaHandler, RechazarVentaHandler, RegistrarVentaHandler } from '@modules/ventas';

/**
 * Array de todos los command handlers del módulo ventas
 */
export const VentaCommandHandlers = [
  RegistrarVentaHandler,
  AprobarVentaHandler,
  RechazarVentaHandler,
];
