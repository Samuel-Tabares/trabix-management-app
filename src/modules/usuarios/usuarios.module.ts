import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';

import { USUARIO_REPOSITORY } from './domain/usuario.repository.interface';
import { PrismaUsuarioRepository } from './infrastructure/prisma-usuario.repository';
import { UsuariosController } from './controllers/usuarios.controller';
import { UsuarioCommandHandlers } from './application/commands';
import { UsuarioQueryHandlers } from './application/queries';

/**
 * Módulo de Usuarios
 * Según sección 20.3 del documento
 * 
 * Gestiona:
 * - Creación de vendedores
 * - Listado y consulta de usuarios
 * - Cambio de estado (ACTIVO/INACTIVO)
 * - Eliminación (soft delete)
 * - Jerarquías de reclutamiento
 */
@Module({
  imports: [
    CqrsModule,
    ConfigModule,
  ],
  controllers: [UsuariosController],
  providers: [
    // Repository
    {
      provide: USUARIO_REPOSITORY,
      useClass: PrismaUsuarioRepository,
    },
    PrismaUsuarioRepository,

    // Command Handlers
    ...UsuarioCommandHandlers,

    // Query Handlers
    ...UsuarioQueryHandlers,
  ],
  exports: [
    USUARIO_REPOSITORY,
    PrismaUsuarioRepository,
  ],
})
export class UsuariosModule {}
