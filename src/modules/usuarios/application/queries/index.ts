export * from './obtener-usuario.query';
export * from './listar-usuarios.query';
export * from './obtener-jerarquia.query';
export * from './obtener-perfil.query';

import { ObtenerUsuarioHandler } from './obtener-usuario.query';
import { ListarUsuariosHandler } from './listar-usuarios.query';
import { ObtenerJerarquiaHandler } from './obtener-jerarquia.query';
import { ObtenerPerfilHandler } from './obtener-perfil.query';

/**
 * Array de todos los query handlers del módulo usuarios
 */
export const UsuarioQueryHandlers = [
  ObtenerUsuarioHandler,
  ListarUsuariosHandler,
  ObtenerJerarquiaHandler,
  ObtenerPerfilHandler,
];
