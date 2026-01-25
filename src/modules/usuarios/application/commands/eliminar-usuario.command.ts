import { CommandHandler, ICommandHandler, ICommand } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Usuario } from '@prisma/client';
import {
  IUsuarioRepository,
  USUARIO_REPOSITORY,
} from '../../domain/usuario.repository.interface';
import { DomainException } from '../../../../domain/exceptions/domain.exception';
import { UsuarioEntity } from '../../domain/usuario.entity';

/**
 * Command para eliminar un usuario (soft delete)
 */
export class EliminarUsuarioCommand implements ICommand {
  constructor(
    public readonly usuarioId: string,
    public readonly adminId: string,
  ) {}
}

/**
 * Handler del comando EliminarUsuario
 * Según sección 1.2:
 * - Un usuario puede ser eliminado por admin
 * - Esto elimina jerarquías inferiores asociadas
 * - No elimina registro histórico relacionado
 * - Registro pasa a sección de "eliminados"
 */
@CommandHandler(EliminarUsuarioCommand)
export class EliminarUsuarioHandler
  implements ICommandHandler<EliminarUsuarioCommand, Usuario>
{
  private readonly logger = new Logger(EliminarUsuarioHandler.name);

  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: IUsuarioRepository,
  ) {}

  async execute(command: EliminarUsuarioCommand): Promise<Usuario> {
    const { usuarioId, adminId } = command;

    // Buscar usuario
    const usuario = await this.usuarioRepository.findById(usuarioId);
    if (!usuario) {
      throw new DomainException('USR_001', 'Usuario no encontrado', {
        usuarioId,
      });
    }

    // Crear entidad de dominio para validaciones
    const usuarioEntity = new UsuarioEntity(usuario);

    // Validar que puede ser eliminado
    usuarioEntity.validarEliminacion();

    // Eliminar usuario (soft delete)
    const usuarioEliminado = await this.usuarioRepository.softDelete(usuarioId);

    // También marcar como eliminados a los reclutados
    // Según documento: "esto elimina jerarquías inferiores asociadas"
    await this.eliminarJerarquiaInferior(usuarioId);

    this.logger.log(`Usuario ${usuarioId} eliminado por admin ${adminId}`);

    return usuarioEliminado;
  }

  /**
   * Elimina (soft delete) toda la jerarquía inferior del usuario
   */
  private async eliminarJerarquiaInferior(usuarioId: string): Promise<void> {
    const reclutados = await this.usuarioRepository.findReclutados(usuarioId);

    for (const reclutado of reclutados) {
      if (!reclutado.eliminado) {
        await this.usuarioRepository.softDelete(reclutado.id);
        // Recursivamente eliminar sub-jerarquías
        await this.eliminarJerarquiaInferior(reclutado.id);
      }
    }
  }
}
