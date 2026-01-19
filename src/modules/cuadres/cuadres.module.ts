import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Domain
import {
    CUADRE_REPOSITORY,
    CalculadoraGananciasService,
    Modelo6040Strategy,
    Modelo5050CascadaStrategy,
} from './domain';

// Infrastructure
import { PrismaCuadreRepository } from './infrastructure';

// Application - Commands, Queries, Events
import { CuadreCommandHandlers } from './application/commands';
import { CuadreQueryHandlers } from './application/queries';
import { CuadreEventHandlers } from './application/events';

// Controllers
import { CuadresController } from './controllers';

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
 */
@Module({
  imports: [
    CqrsModule,
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
