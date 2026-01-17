import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Controllers
import { CuadresMayorController } from '@modules/cuadres-mayor/controllers';

// Domain
import { EvaluadorFinancieroMayorService, CUADRE_MAYOR_REPOSITORY } from '@modules/cuadres-mayor/domain';

// Infrastructure
import { PrismaCuadreMayorRepository } from '@modules/cuadres-mayor/infrastructure';

// Application
import { CuadreMayorCommandHandlers } from './application/commands';
import { CuadreMayorQueryHandlers } from './application/queries';
import { CuadreMayorEventHandlers } from './application/events';

// Related modules
import { LotesModule, UsuariosModule } from '@/modules';
import { CuadresModule } from '@modules/cuadres';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { FondoRecompensasModule } from '../fondo-recompensas/fondo-recompensas.module';

@Module({
  imports: [
    CqrsModule,
    forwardRef(() => LotesModule),
    forwardRef(() => CuadresModule),
    forwardRef(() => UsuariosModule),
    forwardRef(() => NotificacionesModule),
    forwardRef(() => FondoRecompensasModule),
  ],
  controllers: [CuadresMayorController],
  providers: [
    // Repository
    {
      provide: CUADRE_MAYOR_REPOSITORY,
      useClass: PrismaCuadreMayorRepository,
    },
    // Domain Services
    EvaluadorFinancieroMayorService,
    // Command Handlers
    ...CuadreMayorCommandHandlers,
    // Query Handlers
    ...CuadreMayorQueryHandlers,
    // Event Handlers
    ...CuadreMayorEventHandlers,
  ],
  exports: [
    CUADRE_MAYOR_REPOSITORY,
    EvaluadorFinancieroMayorService,
  ],
})
export class CuadresMayorModule {}
