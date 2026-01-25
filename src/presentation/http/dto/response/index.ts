/**
 * Response DTOs
 * 
 * Los DTOs de response están organizados por módulo en:
 * - src/modules/auth/dto/
 * - src/modules/usuarios/application/dto/
 * - src/modules/lotes/application/dto/
 * - src/modules/ventas/application/dto/
 * - src/modules/cuadres/application/dto/
 * - src/modules/ventas-mayor/application/dto/
 * - src/modules/equipamiento/application/dto/
 * - src/modules/notificaciones/application/dto/
 * - src/modules/admin/application/dto/
 * 
 * Cada módulo exporta sus propios DTOs desde su carpeta dto/indexx.ts
 */

// Re-export DTOs de respuesta comunes
export { AuthResponseDto } from '../../../../modules/auth/dto/auth-response.dto';
