/**
 * HTTP Guards
 * Los guards de autenticación y autorización están implementados en el módulo de auth.
 * Re-exportamos desde aquí para uso centralizado.
 */
export { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
export { RolesGuard } from '../../../modules/auth/guards/roles.guard';

// Decorators relacionados
export { Roles } from '../../../modules/auth/decorators/roles.decorator';
export { Public } from '../../../modules/auth/decorators/public.decorator';
export { CurrentUser } from '../../../modules/auth/decorators/current-user.decorator';
