/**
 * Request DTOs
 * 
 * Los DTOs de request están organizados por módulo en:
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
 * Cada módulo exporta sus propios DTOs desde su carpeta dto/index.ts
 */

// Re-export DTOs comunes de autenticación
export { LoginDto } from '../../../../modules/auth/dto/login.dto';
export { RefreshTokenDto } from '../../../../modules/auth/dto/refresh-token.dto';
export { ChangePasswordDto } from '../../../../modules/auth/dto/change-password.dto';
