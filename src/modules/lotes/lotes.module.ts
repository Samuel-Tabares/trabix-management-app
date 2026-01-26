import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';

// Controllers
import { TandasController } from './controllers/tandas.controller';
import { LotesController } from './controllers/lotes.controller'

// Repositories
import { PrismaLoteRepository } from './infrastructure/prisma-lote.repository';
import { PrismaTandaRepository } from './infrastructure/prisma-tanda.repository';
import { LOTE_REPOSITORY } from './domain/lote.repository.interface';
import { TANDA_REPOSITORY } from './domain/tanda.repository.interface';

// Domain Services
import { CalculadoraInversionService } from './domain/calculadora-inversion.service';
import { CalculadoraTandasService } from './domain/calculadora-tandas.service';

// Commands
import { LoteCommandHandlers } from './application/commands';

// Queries
import { LoteQueryHandlers } from './application/queries';

// Events
import { LoteEventHandlers } from './application/events';

// Usuarios Module (para validaciones)
import { UsuariosModule } from '../usuarios/usuarios.module';

// Cuadres Module (para crear cuadres al activar lote)
import { CuadresModule } from '../cuadres/cuadres.module';

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
 * - Solicitud y creación de lotes
 * - Activación de lotes (confirma pago)
 * - Cancelación de solicitudes
 * - División en tandas (2 para ≤50, 3 para >50)
 * - Cálculos de inversión (50/50)
 * - Transiciones de estado de tandas
 * - Resumen financiero
 *
 * Límites:
 * - Máximo 2 lotes en estado CREADO por vendedor
 * - Inversión mínima del vendedor: $20,000
 */
@Module({
  imports: [
    CqrsModule,
    ConfigModule,
    forwardRef(() => UsuariosModule),
    forwardRef(() => CuadresModule),
    forwardRef(() => MiniCuadresModule),
    forwardRef(() => FondoRecompensasModule),
    forwardRef(() => NotificacionesModule),
  ],
  controllers: [LotesController, TandasController],
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
