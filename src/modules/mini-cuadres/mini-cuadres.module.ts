import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';

// Controllers
import { MiniCuadresController } from './controllers/mini-cuadres.controller';

// Domain
import { CierreLoteService } from './domain/cierre-lote.service';
import { MINI_CUADRE_REPOSITORY } from './domain/mini-cuadre.repository.interface';

// Infrastructure
import { PrismaMiniCuadreRepository } from './infrastructure/prisma-mini-cuadre.repository';

// Application
import { MiniCuadreCommandHandlers } from './application/commands';
import { MiniCuadreQueryHandlers } from './application/queries';
import { MiniCuadreEventHandlers } from './application/events';

// Related modules
import { LotesModule } from '../lotes/lotes.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

/**
 * Módulo de Mini-Cuadres
 * Según sección 9 del documento
 *
 * Gestiona:
 * - Activación del mini-cuadre cuando stock llega a 0
 * - Confirmación del mini-cuadre por admin
 * - Cierre de lote (estado FINALIZADO)
 *
 * El mini-cuadre es un evento distinto al cuadre normal que cierra el lote.
 * Se activa automáticamente cuando el stock de la última tanda llega a 0.
 *
 * Estados:
 * - INACTIVO: stock de última tanda > 0
 * - PENDIENTE: stock de última tanda = 0
 * - EXITOSO: admin confirma consolidación final
 */
@Module({
    imports: [
        CqrsModule,
        ConfigModule,
        forwardRef(() => LotesModule),
        forwardRef(() => NotificacionesModule),
    ],
    controllers: [MiniCuadresController],
    providers: [
        {
            provide: MINI_CUADRE_REPOSITORY,
            useClass: PrismaMiniCuadreRepository,
        },
        CierreLoteService,
        ...MiniCuadreCommandHandlers,
        ...MiniCuadreQueryHandlers,
        ...MiniCuadreEventHandlers,
    ],
    exports: [MINI_CUADRE_REPOSITORY, CierreLoteService],
})
export class MiniCuadresModule {}