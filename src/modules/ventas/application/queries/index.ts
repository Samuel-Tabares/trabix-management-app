export * from './obtener-venta.query';
export * from './listar-ventas.query';

import { ObtenerVentaHandler, ListarVentasHandler } from '@modules/ventas';

/**
 * Array de todos los query handlers del módulo ventas
 */
export const VentaQueryHandlers = [
  ObtenerVentaHandler,
  ListarVentasHandler,
];
