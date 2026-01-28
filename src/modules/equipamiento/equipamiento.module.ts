import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';

// Controllers
import { EquipamientoController } from './controllers/equipamiento.controller';

// Domain
import { EQUIPAMIENTO_REPOSITORY } from './domain/equipamiento.repository.interface';
import { EquipamientoConfigService } from './domain/equipamiento-config.service';

// Infrastructure
import { PrismaEquipamientoRepository } from './infrastructure/prisma-equipamiento.repository';

// Application
import { EquipamientoCommandHandlers } from './application/commands';
import { EquipamientoQueryHandlers } from './application/queries';
import { EquipamientoEventHandlers } from './application/events';

// Related modules
import { UsuariosModule } from '../usuarios/usuarios.module';

/**
 * Módulo de Equipamiento
 * Según sección 10 del documento
 *
 * Gestiona:
 * - Solicitud de equipamiento (vendedor)
 * - Activación/entrega de equipamiento (admin)
 * - Reporte de daños y pérdidas (admin)
 * - Devolución de equipamiento (admin)
 *
 * Las deudas de equipamiento se integran con el módulo de cuadres:
 * - Mensualidades pendientes
 * - Deudas por daños
 * - Deudas por pérdida
 *
 * Configuración via .env:
 * - MENSUALIDAD_CON_DEPOSITO
 * - MENSUALIDAD_SIN_DEPOSITO
 * - DEPOSITO_EQUIPAMIENTO
 * - COSTO_DANO_NEVERA
 * - COSTO_DANO_PIJAMA
 */
@Module({
    imports: [
        CqrsModule,
        ConfigModule, // Necesario para EquipamientoConfigService
        forwardRef(() => UsuariosModule),
    ],
    controllers: [EquipamientoController],
    providers: [
        // Repository
        {
            provide: EQUIPAMIENTO_REPOSITORY,
            useClass: PrismaEquipamientoRepository,
        },
        // Domain Services
        EquipamientoConfigService,
        // Command Handlers
        ...EquipamientoCommandHandlers,
        // Query Handlers
        ...EquipamientoQueryHandlers,
        // Event Handlers
        ...EquipamientoEventHandlers,
    ],
    exports: [
        EQUIPAMIENTO_REPOSITORY,
        EquipamientoConfigService,
        // Exportar QueryHandlers para que cuadres pueda consultar deudas
        ...EquipamientoQueryHandlers,
    ],
})
export class EquipamientoModule {}