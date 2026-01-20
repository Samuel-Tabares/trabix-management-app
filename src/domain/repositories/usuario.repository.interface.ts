import { Usuario, Rol, EstadoUsuario, Prisma } from '@prisma/client';
import { IBaseRepository } from './base.repository.interface';
import { PaginationOptions, PaginatedResponse } from '../../shared/interfaces/paginated.interface';

/**
 * Tipos para creación y actualización de Usuario
 */
export type CreateUsuarioInput = Prisma.UsuarioCreateInput;
export type UpdateUsuarioInput = Prisma.UsuarioUpdateInput;

/**
 * Filtros para búsqueda de usuarios
 */
export interface UsuarioFilters {
  rol?: Rol;
  estado?: EstadoUsuario;
  reclutadorId?: string;
  eliminado?: boolean;
}

/**
 * Interface del repositorio de Usuarios
 * Según sección 1 y 17.1 del documento
 */
export interface IUsuarioRepository extends IBaseRepository<Usuario, CreateUsuarioInput, UpdateUsuarioInput> {
  /**
   * Busca un usuario por cédula
   */
  findByCedula(cedula: number): Promise<Usuario | null>;

  /**
   * Busca un usuario por email
   */
  findByEmail(email: string): Promise<Usuario | null>;

  /**
   * Busca un usuario por teléfono
   */
  findByTelefono(telefono: string): Promise<Usuario | null>;

  /**
   * Busca usuarios con filtros y paginación
   */
  findWithFilters(
    filters: UsuarioFilters,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Usuario>>;

  /**
   * Obtiene los usuarios reclutados por un usuario
   */
  findReclutados(reclutadorId: string): Promise<Usuario[]>;

  /**
   * Obtiene la jerarquía completa de un usuario hacia arriba (hasta admin)
   */
  findJerarquiaAscendente(usuarioId: string): Promise<Usuario[]>;

  /**
   * Obtiene la jerarquía descendente (árbol de reclutados)
   */
  findJerarquiaDescendente(usuarioId: string): Promise<Usuario[]>;

  /**
   * Cambia el estado de un usuario
   */
  cambiarEstado(id: string, estado: EstadoUsuario): Promise<Usuario>;

  /**
   * Actualiza el hash del refresh token
   */
  updateRefreshTokenHash(id: string, hash: string | null): Promise<void>;

  /**
   * Incrementa intentos fallidos de login
   */
  incrementarIntentosFallidos(id: string): Promise<number>;

  /**
   * Resetea intentos fallidos de login
   */
  resetearIntentosFallidos(id: string): Promise<void>;

  /**
   * Bloquea un usuario hasta cierta fecha
   */
  bloquearHasta(id: string, fecha: Date): Promise<void>;

  /**
   * Marca contraseña como cambiada
   */
  marcarPasswordCambiado(id: string): Promise<void>;

  /**
   * Actualiza último login
   */
  updateUltimoLogin(id: string): Promise<void>;

  /**
   * Soft delete de usuario (según sección 18.5)
   */
  softDelete(id: string): Promise<void>;

  /**
   * Verifica si existe cédula (excluyendo un ID)
   */
  existsCedula(cedula: number, excludeId?: string): Promise<boolean>;

  /**
   * Verifica si existe email (excluyendo un ID)
   */
  existsEmail(email: string, excludeId?: string): Promise<boolean>;

  /**
   * Verifica si existe teléfono (excluyendo un ID)
   */
  existsTelefono(telefono: string, excludeId?: string): Promise<boolean>;
}
