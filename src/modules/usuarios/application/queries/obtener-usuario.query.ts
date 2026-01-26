import { QueryHandler, IQueryHandler, IQuery } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { Rol } from '@prisma/client';
import {
  IUsuarioRepository,
  USUARIO_REPOSITORY,
} from '../../domain/usuario.repository.interface';
import { DomainException } from '../../../../domain/exceptions/domain.exception';
import { UsuarioResponseDto, UsuarioBasicoDto } from '../dto/usuario-response.dto';

/**
 * Query para obtener un usuario por ID
 */
export class ObtenerUsuarioQuery implements IQuery {
  constructor(
    public readonly usuarioId: string,
    public readonly includeReclutador: boolean = true,
  ) {}
}

/**
 * Handler de la query ObtenerUsuario
 */
@QueryHandler(ObtenerUsuarioQuery)
export class ObtenerUsuarioHandler
  implements IQueryHandler<ObtenerUsuarioQuery, UsuarioResponseDto>
{
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: IUsuarioRepository,
  ) {}

  async execute(query: ObtenerUsuarioQuery): Promise<UsuarioResponseDto> {
    const { usuarioId, includeReclutador } = query;

    const usuario = await this.usuarioRepository.findById(usuarioId);
    if (!usuario) {
      throw new DomainException('USR_001', 'Usuario no encontrado', {
        usuarioId,
      });
    }

    if (usuario.eliminado) {
      throw new DomainException('USR_001', 'Usuario no encontrado', {
        usuarioId,
      });
    }

    // Obtener reclutador si es necesario
    let reclutador: UsuarioBasicoDto | null = null;
    let reclutadorRol: Rol | null = null;

    if (includeReclutador && usuario.reclutadorId) {
      const reclutadorData = await this.usuarioRepository.findById(
        usuario.reclutadorId,
      );
      if (reclutadorData) {
        reclutadorRol = reclutadorData.rol;
        reclutador = {
          id: reclutadorData.id,
          nombre: reclutadorData.nombre,
          apellidos: reclutadorData.apellidos,
          nombreCompleto: `${reclutadorData.nombre} ${reclutadorData.apellidos}`,
          email: reclutadorData.email,
          rol: reclutadorData.rol,
        };
      }
    }

    // Determinar modelo de negocio
    const modeloNegocio = this.determinarModeloNegocio(
      usuario.reclutadorId,
      reclutadorRol,
    );

    return {
      id: usuario.id,
      cedula: usuario.cedula,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      nombreCompleto: `${usuario.nombre} ${usuario.apellidos}`,
      email: usuario.email,
      telefono: usuario.telefono,
      rol: usuario.rol,
      estado: usuario.estado,
      requiereCambioPassword: usuario.requiereCambioPassword,
      reclutadorId: usuario.reclutadorId,
      reclutador,
      fechaCreacion: usuario.fechaCreacion,
      ultimoLogin: usuario.ultimoLogin,
      fechaCambioEstado: usuario.fechaCambioEstado,
      modeloNegocio,
    };
  }

  /**
   * Determina el modelo de negocio del usuario
   * Según sección 2.4 del documento
   */
  private determinarModeloNegocio(
    reclutadorId: string | null,
    reclutadorRol: Rol | null,
  ): '60_40' | '50_50' {
    // Si no tiene reclutador o el reclutador es ADMIN → 60/40
    if (!reclutadorId || reclutadorRol === 'ADMIN') {
      return '60_40';
    }
    // Si el reclutador es VENDEDOR o RECLUTADOR → 50/50
    return '50_50';
  }
}
