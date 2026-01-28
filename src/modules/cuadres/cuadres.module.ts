import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';

// Domain
import {
    CalculadoraGananciasService,
    Modelo6040Strategy,
    Modelo5050CascadaStrategy,
} from './domain/calculadora-ganancias.service';
import { CUADRE_REPOSITORY } from './domain/cuadre.repository.interface';

// Infrastructure
import { PrismaCuadreRepository } from './infrastructure/prisma-cuadre.repository';

// Application - Commands, Queries, Events
import { CuadreCommandHandlers } from './application/commands';
import { CuadreQueryHandlers } from './application/queries';
import { CuadreEventHandlers } from './application/events';

// Controllers
import { CuadresController } from './controllers/cuadres.controller';

// Módulos necesarios
import { LotesModule } from '../lotes/lotes.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

/**
 * Módulo de Cuadres
 * Según sección 8 del documento
 *
 * Responsabilidades:
 * - Gestión de cuadres normales
 * - Cálculo de ganancias (60/40 y 50/50 con cascada)
 * - Triggers automáticos de activación
 * - Confirmación de transferencias
 * - Liberación de tandas al confirmar exitoso
 *
 * Estados de cuadre:
 * - INACTIVO: aún no se cumple el trigger
 * - PENDIENTE: trigger cumplido, esperando transferencia
 * - EXITOSO: admin confirmó transferencia completa
 *
 * Configuración:
 * - Los porcentajes de ganancias se configuran vía variables de entorno
 * - PORCENTAJE_GANANCIA_VENDEDOR_60_40, PORCENTAJE_GANANCIA_ADMIN_60_40
 * - PORCENTAJE_GANANCIA_VENDEDOR_50_50
 */
@Module({
    imports: [
        CqrsModule,
        ConfigModule, // Necesario para que las estrategias accedan a ConfigService
        forwardRef(() => LotesModule),
        forwardRef(() => NotificacionesModule),
    ],
    controllers: [CuadresController],
    providers: [
        // Repository
        {
            provide: CUADRE_REPOSITORY,
            useClass: PrismaCuadreRepository,
        },

        // Domain Services - Estrategias de ganancias
        // Las estrategias ahora usan ConfigService para obtener porcentajes
        Modelo6040Strategy,
        Modelo5050CascadaStrategy,
        CalculadoraGananciasService,

        // Command Handlers
        ...CuadreCommandHandlers,

        // Query Handlers
        ...CuadreQueryHandlers,

        // Event Handlers
        ...CuadreEventHandlers,
    ],
    exports: [
        CUADRE_REPOSITORY,
        CalculadoraGananciasService,
        Modelo6040Strategy,
        Modelo5050CascadaStrategy,
    ],
})
export class CuadresModule {}