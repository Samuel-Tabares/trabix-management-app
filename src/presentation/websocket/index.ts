/**
 * WebSocket Gateway
 * 
 * El gateway de WebSocket está implementado en el módulo de notificaciones:
 * - src/modules/notificaciones/gateways/notificaciones.gateway.ts
 * 
 * Funcionalidades:
 * - Conexión autenticada por JWT
 * - Envío de notificaciones en tiempo real
 * - Eventos: notificacion:nueva, notificacion:leida
 * 
 * Los clientes se conectan a: ws://servidor:puerto/notificaciones
 */

// Re-export del gateway de notificaciones
export { NotificacionesGateway } from '../../modules/notificaciones/gateways/notificaciones.gateway';
