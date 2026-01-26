import { QueryHandler, IQueryHandler, IQuery } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { Rol } from '@prisma/client';
import {
  IUsuarioRepository,
  USUARIO_REPOSITORY,
} from '../../domain/usuario.repository.interface';
import {
  UsuarioResponseDto,
  UsuariosPaginadosDto,
  UsuarioBasicoDto,
} from '../dto/usuario-response.dto';
import {
    QueryUsuariosDto,
} from '../dto/query-usuarios.dto';


/**
 * Query para listar usuarios con filtros y paginación
 */
export class ListarUsuariosQuery implements IQuery {
  constructor(public readonly filtros: QueryUsuariosDto) {}
}

/**
 * Handler de la query ListarUsuarios
 */
@QueryHandler(ListarUsuariosQuery)
export class ListarUsuariosHandler
  implements IQueryHandler<ListarUsuariosQuery, UsuariosPaginadosDto>
{
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: IUsuarioRepository,
  ) {}

  async execute(query: ListarUsuariosQuery): Promise<UsuariosPaginadosDto> {
    const { filtros } = query;

    const resultado = await this.usuarioRepository.findAll({
      skip: filtros.skip,
      take: filtros.take,
      cursor: filtros.cursor,
      where: {
        rol: filtros.rol,
        estado: filtros.estado,
        eliminado: filtros.eliminado ?? false,
        reclutadorId: filtros.reclutadorId,
        search: filtros.search,
        cedula: filtros.cedula,
      },
      orderBy: {
        field: filtros.orderBy || 'fechaCreacion',
        direction: filtros.orderDirection || 'desc',
      },
      includeReclutador: true,
    });

    // Mapear a DTOs
    const data: UsuarioResponseDto[] = await Promise.all(
      resultado.data.map(async (usuario) => {
        let reclutador: UsuarioBasicoDto | null = null;
        let reclutadorRol: Rol | null = null;

        if (usuario.reclutadorId) {
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
      }),
    );

    return {
      data,
      total: resultado.total,
      hasMore: resultado.hasMore,
      nextCursor: resultado.nextCursor,
    };
  }

  private determinarModeloNegocio(
    reclutadorId: string | null,
    reclutadorRol: Rol | null,
  ): '60_40' | '50_50' {
    if (!reclutadorId || reclutadorRol === 'ADMIN') {
      return '60_40';
    }
    return '50_50';
  }
}
