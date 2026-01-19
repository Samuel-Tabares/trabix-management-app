import { Rol, EstadoUsuario } from '@prisma/client';
import { DomainException } from '../../../domain/exceptions/domain.exception';

/**
 * Entidad de dominio Usuario
 * Según secciones 1.1, 1.2 del documento
 * 
 * Reglas de negocio:
 * - Admin crea vendedor con contraseña temporal
 * - Contraseña debe cambiarse antes de operar
 * - Estados: ACTIVO/INACTIVO
 * - Soft delete (eliminado = true)
 * - Jerarquía: reclutador → reclutados
 * - Roles: ADMIN, VENDEDOR, RECLUTADOR (vendedor con reclutados)
 */
export class UsuarioEntity {
  readonly id: string;
  readonly cedula: string;
  readonly nombre: string;
  readonly apellidos: string;
  readonly email: string;
  readonly telefono: string;
  readonly passwordHash: string;
  readonly requiereCambioPassword: boolean;
  readonly rol: Rol;
  readonly estado: EstadoUsuario;
  readonly reclutadorId: string | null;
  readonly refreshTokenHash: string | null;
  readonly intentosFallidos: number;
  readonly bloqueadoHasta: Date | null;
  readonly fechaCreacion: Date;
  readonly ultimoLogin: Date | null;
  readonly fechaCambioEstado: Date | null;
  readonly eliminado: boolean;
  readonly fechaEliminacion: Date | null;

  constructor(props: UsuarioEntityProps) {
    this.id = props.id;
    this.cedula = props.cedula;
    this.nombre = props.nombre;
    this.apellidos = props.apellidos;
    this.email = props.email;
    this.telefono = props.telefono;
    this.passwordHash = props.passwordHash;
    this.requiereCambioPassword = props.requiereCambioPassword;
    this.rol = props.rol;
    this.estado = props.estado;
    this.reclutadorId = props.reclutadorId;
    this.refreshTokenHash = props.refreshTokenHash;
    this.intentosFallidos = props.intentosFallidos;
    this.bloqueadoHasta = props.bloqueadoHasta;
    this.fechaCreacion = props.fechaCreacion;
    this.ultimoLogin = props.ultimoLogin;
    this.fechaCambioEstado = props.fechaCambioEstado;
    this.eliminado = props.eliminado;
    this.fechaEliminacion = props.fechaEliminacion;
  }

  /**
   * Nombre completo del usuario
   */
  get nombreCompleto(): string {
    return `${this.nombre} ${this.apellidos}`;
  }

  /**
   * Verifica si el usuario está activo y puede operar
   * Según sección 1.2: Usuario ACTIVO puede crear lotes, registrar ventas, etc.
   */
  get puedeOperar(): boolean {
    return (
      this.estado === 'ACTIVO' &&
      !this.eliminado &&
      !this.requiereCambioPassword &&
      !this.estaBloqueado
    );
  }

  /**
   * Verifica si el usuario está bloqueado temporalmente
   */
  get estaBloqueado(): boolean {
    return this.bloqueadoHasta !== null && this.bloqueadoHasta > new Date();
  }

  /**
   * Verifica si el usuario es reclutador (tiene reclutados)
   * Según sección 1.1: RECLUTADOR es VENDEDOR que obtiene beneficios de reclutador
   */
  get esReclutador(): boolean {
    // Esto se determina externamente verificando si tiene reclutados
    // La entidad no tiene acceso a los reclutados directamente
    return false;
  }

  /**
   * Valida si puede cambiar a un nuevo estado
   */
  validarCambioEstado(nuevoEstado: EstadoUsuario): void {
    if (this.eliminado) {
      throw new DomainException(
        'USR_001',
        'No se puede cambiar el estado de un usuario eliminado',
      );
    }

    if (this.estado === nuevoEstado) {
      throw new DomainException(
        'USR_006',
        `El usuario ya está en estado ${nuevoEstado}`,
      );
    }
  }

  /**
   * Valida si el usuario puede ser eliminado
   * Según sección 1.2: Un usuario puede ser eliminado por admin
   */
  validarEliminacion(): void {
    if (this.eliminado) {
      throw new DomainException(
        'USR_001',
        'El usuario ya está eliminado',
      );
    }

    if (this.rol === 'ADMIN') {
      throw new DomainException(
        'USR_006',
        'No se puede eliminar al usuario administrador',
      );
    }
  }

  /**
   * Valida si puede ser reclutador de otro usuario
   */
  validarComoReclutador(): void {
    if (this.eliminado) {
      throw new DomainException(
        'USR_005',
        'Un usuario eliminado no puede ser reclutador',
      );
    }

    if (this.estado !== 'ACTIVO') {
      throw new DomainException(
        'USR_005',
        'Un usuario inactivo no puede ser reclutador',
      );
    }

    if (this.rol === 'ADMIN') {
      // Admin puede ser reclutador (caso base según sección 2.3)
      return;
    }
  }

  /**
   * Obtiene el modelo de negocio del usuario
   * Según sección 2.4:
   * - MODELO 60/40: vendedores que ingresan directamente con Admin (nivel N2)
   * - MODELO 50/50: vendedores que ingresan con un reclutador (nivel N3 en adelante)
   */
  obtenerModeloNegocio(reclutadorRol: Rol | null): '60_40' | '50_50' {
    // Si no tiene reclutador o el reclutador es ADMIN → 60/40
    if (!this.reclutadorId || reclutadorRol === 'ADMIN') {
      return '60_40';
    }
    // Si el reclutador es VENDEDOR o RECLUTADOR → 50/50
    return '50_50';
  }
}

/**
 * Props para crear una entidad Usuario
 */
export interface UsuarioEntityProps {
  id: string;
  cedula: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  passwordHash: string;
  requiereCambioPassword: boolean;
  rol: Rol;
  estado: EstadoUsuario;
  reclutadorId: string | null;
  refreshTokenHash: string | null;
  intentosFallidos: number;
  bloqueadoHasta: Date | null;
  fechaCreacion: Date;
  ultimoLogin: Date | null;
  fechaCambioEstado: Date | null;
  eliminado: boolean;
  fechaEliminacion: Date | null;
}

/**
 * Props para crear un nuevo usuario
 */
export interface CrearUsuarioProps {
  cedula: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  passwordHash: string;
  reclutadorId?: string | null;
  rol?: Rol;
}
