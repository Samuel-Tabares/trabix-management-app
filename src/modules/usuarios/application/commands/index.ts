export * from './crear-usuario.command';
export * from './actualizar-usuario.command';
export * from './cambiar-estado.command';
export * from './eliminar-usuario.command';
export * from './restaurar-usuario.command';

import { CrearUsuarioHandler } from './crear-usuario.command';
import { ActualizarUsuarioHandler } from './actualizar-usuario.command';
import { CambiarEstadoHandler } from './cambiar-estado.command';
import { EliminarUsuarioHandler } from './eliminar-usuario.command';
import { RestaurarUsuarioHandler } from './restaurar-usuario.command';

/**
 * Array de todos los command handlers del módulo usuarios
 */
export const UsuarioCommandHandlers = [
  CrearUsuarioHandler,
  ActualizarUsuarioHandler,
  CambiarEstadoHandler,
  EliminarUsuarioHandler,
  RestaurarUsuarioHandler,
];
