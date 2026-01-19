import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Controllers
import { CuadresMayorController } from './controllers/cuadres-mayor.controller';

// Domain
import { EvaluadorFinancieroMayorService } from './domain/evaluador-financiero-mayor.service';
import { CUADRE_MAYOR_REPOSITORY } from './domain/cuadre-mayor.repository.interface';

// Infrastructure
import { PrismaCuadreMayorRepository } from './infrastructure/prisma-cuadre-mayor.repository';

// Application
import { CuadreMayorCommandHandlers } from './application/commands';
import { CuadreMayorQueryHandlers } from './application/queries';
import { CuadreMayorEventHandlers } from './application/events';

// Related modules
import { LotesModule } from '../lotes/lotes.module';
import { CuadresModule } from '../cuadres/cuadres.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
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
