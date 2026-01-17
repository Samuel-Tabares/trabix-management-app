/**
 * Infraestructura de Notificaciones
 * 
 * La implementación de notificaciones está en el módulo de notificaciones:
 * 
 * - Gateway WebSocket: src/modules/notificaciones/gateways/
 * - Dispatcher: src/modules/notificaciones/factories/notification-dispatcher.ts
 * - Content Factory: src/modules/notificaciones/factories/notification-content.factory.ts
 * - Repository: src/modules/notificaciones/infrastructure/
 * 
 * Canales soportados:
 * - WEBSOCKET (tiempo real)
 * - PUSH (notificaciones push - preparado para implementación futura)
 * - EMAIL (preparado para implementación futura)
 */

// Re-export factories de notificaciones
export * from '../../modules/notificaciones/factories';
