import { QueryHandler, IQueryHandler, IQuery } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  IUsuarioRepository,
  USUARIO_REPOSITORY,
  UsuarioJerarquia,
} from '../../domain/usuario.repository.interface';
import { DomainException } from '../../../../domain/exceptions/domain.exception';
import { UsuarioJerarquiaDto, UsuarioBasicoDto } from '../dto';

/**
 * Query para obtener la jerarquía de un usuario
 */
export class ObtenerJerarquiaQuery implements IQuery {
  constructor(public readonly usuarioId: string) {}
}

/**
 * Handler de la query ObtenerJerarquia
 * Según sección 2.1 del documento:
 * - Nivel N: comprador del lote
 * - Nivel N-1: reclutador directo
 * - Nivel N-2: reclutador del reclutador
 * - ... hasta ADMIN
 */
@QueryHandler(ObtenerJerarquiaQuery)
export class ObtenerJerarquiaHandler
  implements IQueryHandler<ObtenerJerarquiaQuery, UsuarioJerarquiaDto>
{
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: IUsuarioRepository,
  ) {}

  async execute(query: ObtenerJerarquiaQuery): Promise<UsuarioJerarquiaDto> {
    const { usuarioId } = query;

    // Verificar que el usuario existe
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

    // Obtener la jerarquía completa
    const jerarquia = await this.usuarioRepository.findJerarquia(usuarioId);

    // Mapear a DTO
    return this.mapJerarquiaToDto(jerarquia);
  }

  /**
   * Mapea la estructura de jerarquía del repositorio al DTO
   */
  private mapJerarquiaToDto(jerarquia: UsuarioJerarquia): UsuarioJerarquiaDto {
    const usuarioBasico: UsuarioBasicoDto = {
      id: jerarquia.usuario.id,
      nombre: jerarquia.usuario.nombre,
      apellidos: jerarquia.usuario.apellidos,
      nombreCompleto: `${jerarquia.usuario.nombre} ${jerarquia.usuario.apellidos}`,
      email: jerarquia.usuario.email,
      rol: jerarquia.usuario.rol,
    };

    return {
      usuario: usuarioBasico,
      reclutados: jerarquia.reclutados.map((r) => this.mapJerarquiaToDto(r)),
      totalReclutados: jerarquia.totalReclutados,
      nivel: jerarquia.nivel,
    };
  }
}
