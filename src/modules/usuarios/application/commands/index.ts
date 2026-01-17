export * from './crear-usuario.command';
export * from './actualizar-usuario.command';
export * from './cambiar-estado.command';
export * from './eliminar-usuario.command';

import { CrearUsuarioHandler,EliminarUsuarioHandler,CambiarEstadoHandler,ActualizarUsuarioHandler } from '@/modules';


/**
 * Array de todos los command handlers del módulo usuarios
 */
export const UsuarioCommandHandlers = [
  CrearUsuarioHandler,
  ActualizarUsuarioHandler,
  CambiarEstadoHandler,
  EliminarUsuarioHandler,
];
