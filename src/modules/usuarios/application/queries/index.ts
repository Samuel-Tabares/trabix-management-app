export * from './obtener-usuario.query';
export * from './listar-usuarios.query';
export * from './obtener-jerarquia.query';
export * from './obtener-perfil.query';

import { ObtenerUsuarioHandler,ListarUsuariosHandler,ObtenerJerarquiaHandler,ObtenerPerfilHandler } from '@/modules';


/**
 * Array de todos los query handlers del módulo usuarios
 */
export const UsuarioQueryHandlers = [
  ObtenerUsuarioHandler,
  ListarUsuariosHandler,
  ObtenerJerarquiaHandler,
  ObtenerPerfilHandler,
];
