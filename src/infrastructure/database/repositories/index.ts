/**
 * Implementaciones de Repositorios Prisma
 * 
 * Los repositorios están implementados dentro de cada módulo en:
 * - src/modules/usuarios/infrastructure/
 * - src/modules/lotes/infrastructure/
 * - src/modules/ventas/infrastructure/
 * - src/modules/cuadres/infrastructure/
 * - src/modules/ventas-mayor/infrastructure/
 * - src/modules/equipamiento/infrastructure/
 * - src/modules/notificaciones/infrastructure/
 * - src/modules/fondo-recompensas/infrastructure/
 * - src/modules/admin/infrastructure/
 * 
 * Las interfaces de repositorios están en:
 * - src/domain/repositories/
 * 
 * Este archivo re-exporta las interfaces para uso centralizado.
 */

// Re-export repository interfaces
export * from '../../../domain/repositories';
