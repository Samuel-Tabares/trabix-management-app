import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Controllers
import { EquipamientoController } from './controllers/equipamiento.controller';

// Domain
import { EQUIPAMIENTO_REPOSITORY } from './domain/equipamiento.repository.interface';

// Infrastructure
import { PrismaEquipamientoRepository } from './infrastructure/prisma-equipamiento.repository';

// Application
import { EquipamientoCommandHandlers } from './application/commands';
import { EquipamientoQueryHandlers } from './application/queries';
import { EquipamientoEventHandlers } from './application/events';

// Related modules
import { UsuariosModule } from '../usuarios/usuarios.module';

/**
 * Módulo de Equipamiento
 * Según sección 10 del documento
 * 
 * Gestiona:
 * - Solicitud y activación de equipamiento (nevera+pijama)
 * - Pago de mensualidades
 * - Reporte de daños y pérdidas
 * - Devolución de equipamiento y depósito
 */
@Module({
  imports: [
    CqrsModule,
    forwardRef(() => UsuariosModule),
  ],
  controllers: [EquipamientoController],
  providers: [
    // Repository
    {
      provide: EQUIPAMIENTO_REPOSITORY,
      useClass: PrismaEquipamientoRepository,
    },
    // Command Handlers
    ...EquipamientoCommandHandlers,
    // Query Handlers
    ...EquipamientoQueryHandlers,
    // Event Handlers
    ...EquipamientoEventHandlers,
  ],
  exports: [EQUIPAMIENTO_REPOSITORY],
})
export class EquipamientoModule {}
