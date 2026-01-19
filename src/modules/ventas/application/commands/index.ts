export * from './registrar-venta.command';
export * from './aprobar-venta.command';
export * from './rechazar-venta.command';

import { RegistrarVentaHandler } from './registrar-venta.command';
import { AprobarVentaHandler } from './aprobar-venta.command';
import { RechazarVentaHandler } from './rechazar-venta.command';

/**
 * Array de todos los command handlers del módulo ventas
 */
export const VentaCommandHandlers = [
  RegistrarVentaHandler,
  AprobarVentaHandler,
  RechazarVentaHandler,
];
