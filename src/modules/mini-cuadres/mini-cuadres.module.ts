import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Controllers
import { MiniCuadresController } from '@modules/mini-cuadres/controllers';

// Domain
import { CierreLoteService } from './domain/cierre-lote.service';
import { MINI_CUADRE_REPOSITORY } from '@modules/mini-cuadres/domain';

// Infrastructure
import { PrismaMiniCuadreRepository } from '@modules/mini-cuadres/infrastructure';

// Application
import { MiniCuadreCommandHandlers } from './application/commands';
import { MiniCuadreQueryHandlers } from './application/queries';
import { MiniCuadreEventHandlers } from './application/events';

// Related modules
import { LotesModule } from '@/modules';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

/**
 * Módulo de Mini-Cuadres
 * Según sección 9 del documento
 * 
 * Gestiona:
 * - Activación del mini-cuadre cuando stock llega a 0
 * - Confirmación del mini-cuadre por admin
 * - Cierre de lote (estado FINALIZADO)
 */
@Module({
  imports: [
    CqrsModule,
    forwardRef(() => LotesModule),
    forwardRef(() => NotificacionesModule),
  ],
  controllers: [MiniCuadresController],
  providers: [
    // Repository
    {
      provide: MINI_CUADRE_REPOSITORY,
      useClass: PrismaMiniCuadreRepository,
    },
    // Domain Services
    CierreLoteService,
    // Command Handlers
    ...MiniCuadreCommandHandlers,
    // Query Handlers
    ...MiniCuadreQueryHandlers,
    // Event Handlers
    ...MiniCuadreEventHandlers,
  ],
  exports: [
    MINI_CUADRE_REPOSITORY,
    CierreLoteService,
  ],
})
export class MiniCuadresModule {}
