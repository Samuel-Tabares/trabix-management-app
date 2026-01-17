import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Controllers
import { FondoRecompensasController } from './controllers';

// Domain
import {
  FondoRecompensasService,
  FONDO_RECOMPENSAS_REPOSITORY,
} from './domain';

// Infrastructure
import { PrismaFondoRecompensasRepository } from './infrastructure';

// Application
import { FondoRecompensasCommandHandlers } from './application/commands';
import { FondoRecompensasQueryHandlers } from './application/queries';
import { FondoRecompensasEventHandlers } from './application/events';

/**
 * Módulo del Fondo de Recompensas
 * Según sección 12 del documento
 * 
 * Gestiona:
 * - Consulta de saldo del fondo
 * - Listado de transacciones (entradas y salidas)
 * - Registro de salidas (admin)
 * - Las entradas se registran automáticamente al activar lotes
 */
@Module({
  imports: [CqrsModule],
  controllers: [FondoRecompensasController],
  providers: [
    // Repository
    {
      provide: FONDO_RECOMPENSAS_REPOSITORY,
      useClass: PrismaFondoRecompensasRepository,
    },
    // Domain Services
    FondoRecompensasService,
    // Command Handlers
    ...FondoRecompensasCommandHandlers,
    // Query Handlers
    ...FondoRecompensasQueryHandlers,
    // Event Handlers
    ...FondoRecompensasEventHandlers,
  ],
  exports: [FONDO_RECOMPENSAS_REPOSITORY, FondoRecompensasService],
})
export class FondoRecompensasModule {}
