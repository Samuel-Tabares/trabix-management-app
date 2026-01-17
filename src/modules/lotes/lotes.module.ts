import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';

// Controllers
import {
    // Controllers
    LotesController,
    TandasController,

    // Repositories
    PrismaLoteRepository,
    PrismaTandaRepository,
    LOTE_REPOSITORY,
    TANDA_REPOSITORY,

    // Domain Services
    CalculadoraInversionService,
    CalculadoraTandasService,

    // Commands
    LoteCommandHandlers,

    // Queries
    LoteQueryHandlers,

    // Events
    LoteEventHandlers,

    // Usuarios Module (para validaciones)
    UsuariosModule,
} from '@/modules';


// Cuadres Module (para crear cuadres al activar lote)
import { CuadresModule } from '@modules/cuadres';

// Mini-Cuadres Module (para crear mini-cuadre al activar lote)
import { MiniCuadresModule } from '../mini-cuadres/mini-cuadres.module';

// Fondo Recompensas Module (para registrar entrada al activar lote)
import { FondoRecompensasModule } from '../fondo-recompensas/fondo-recompensas.module';

// Notificaciones Module (para enviar notificación al activar lote)
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

/**
 * Módulo de Lotes y Tandas
 * Según secciones 3 y 4 del documento
 * 
 * Gestiona:
 * - Creación y activación de lotes
 * - División en tandas (2 para ≤50, 3 para >50)
 * - Cálculos de inversión (50/50)
 * - Transiciones de estado de tandas
 * - Resumen financiero
 */
@Module({
  imports: [
    CqrsModule,
    ConfigModule,
    UsuariosModule,
    forwardRef(() => CuadresModule),
    forwardRef(() => MiniCuadresModule),
    forwardRef(() => FondoRecompensasModule),
    forwardRef(() => NotificacionesModule),
  ],
  controllers: [
    LotesController,
    TandasController,
  ],
  providers: [
    // Repositories
    {
      provide: LOTE_REPOSITORY,
      useClass: PrismaLoteRepository,
    },
    {
      provide: TANDA_REPOSITORY,
      useClass: PrismaTandaRepository,
    },
    PrismaLoteRepository,
    PrismaTandaRepository,

    // Domain Services
    CalculadoraInversionService,
    CalculadoraTandasService,

    // Command Handlers
    ...LoteCommandHandlers,

    // Query Handlers
    ...LoteQueryHandlers,

    // Event Handlers
    ...LoteEventHandlers,
  ],
  exports: [
    LOTE_REPOSITORY,
    TANDA_REPOSITORY,
    CalculadoraInversionService,
    CalculadoraTandasService,
  ],
})
export class LotesModule {}
