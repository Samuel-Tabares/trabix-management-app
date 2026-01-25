import { Module, forwardRef } from '@nestjs/common';
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

// Usuarios Module (para validar vendedor beneficiario)
import { UsuariosModule } from '../usuarios/usuarios.module';

// Notificaciones Module (para notificar al beneficiario)
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

/**
 * Módulo del Fondo de Recompensas
 * Según sección 12 del documento
 * 
 * Gestiona:
 * - Consulta de saldo del fondo (todos los usuarios)
 * - Listado de transacciones (todos los usuarios)
 * - Registro de salidas/premios (solo admin)
 * 
 * Las entradas se registran automáticamente al activar lotes
 * desde el LoteActivadoEvent en el módulo de lotes.
 * 
 * Cálculo:
 * - Aporte por TRABIX = $200 (configurable)
 * - Al activar lote: entrada = cantidadTrabix × $200
 */
@Module({
  imports: [
    CqrsModule,
    forwardRef(() => UsuariosModule),
    forwardRef(() => NotificacionesModule),
  ],
  controllers: [FondoRecompensasController],
  providers: [
    // Repository
    {
      provide: FONDO_RECOMPENSAS_REPOSITORY,
      useClass: PrismaFondoRecompensasRepository,
    },
    PrismaFondoRecompensasRepository,
    
    // Domain Services
    FondoRecompensasService,
    
    // Command Handlers
    ...FondoRecompensasCommandHandlers,
    
    // Query Handlers
    ...FondoRecompensasQueryHandlers,
    
    // Event Handlers
    ...FondoRecompensasEventHandlers,
  ],
  exports: [
    FONDO_RECOMPENSAS_REPOSITORY,
    FondoRecompensasService,
  ],
})
export class FondoRecompensasModule {}
