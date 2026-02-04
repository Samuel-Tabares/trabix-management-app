import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Controllers
import { VentasMayorController } from './controllers/ventas-mayor.controller';

// Domain
import { ConsumidorStockMayorService } from './domain/consumidor-stock-mayor.service';
import { CalculadoraPreciosMayorService } from './domain/calculadora-precios-mayor.service';
import { VENTA_MAYOR_REPOSITORY } from './domain/venta-mayor.repository.interface';

// Infrastructure
import { PrismaVentaMayorRepository } from './infrastructure/prisma-venta-mayor.repository';

// Application
import { VentaMayorCommandHandlers } from './application/commands';
import { VentaMayorQueryHandlers } from './application/queries';
import { VentaMayorEventHandlers } from './application/events';

// Related modules
import { LotesModule } from '../lotes/lotes.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { CuadresMayorModule } from '../cuadres-mayor/cuadres-mayor.module';
import { CuadresModule } from '../cuadres/cuadres.module';
import {EquipamientoModule} from "../equipamiento/equipamiento.module";

/**
 * Módulo de Ventas al Mayor
 * Según sección 7 del documento
 *
 * Responsabilidades:
 * - Registro de ventas al mayor (>20 unidades)
 * - Cálculo de precios por rangos
 * - Consumo de stock de múltiples fuentes
 * - Generación de cuadres al mayor
 *
 * Los precios se cargan desde configuración para cada rango:
 * - 21-50 unidades
 * - 51-100 unidades
 * - 101+ unidades
 */
@Module({
    imports: [
        CqrsModule,
        forwardRef(() => LotesModule),
        forwardRef(() => UsuariosModule),
        forwardRef(() => CuadresMayorModule),
        forwardRef(() => CuadresModule),
        forwardRef(() => EquipamientoModule), // Para ObtenerDeudaEquipamientoQuery
    ],
    controllers: [VentasMayorController],
    providers: [
        // Repository
        {
            provide: VENTA_MAYOR_REPOSITORY,
            useClass: PrismaVentaMayorRepository,
        },
        // Domain Services
        ConsumidorStockMayorService,
        CalculadoraPreciosMayorService,
        // Command Handlers
        ...VentaMayorCommandHandlers,
        // Query Handlers
        ...VentaMayorQueryHandlers,
        // Event Handlers
        ...VentaMayorEventHandlers,
    ],
    exports: [
        VENTA_MAYOR_REPOSITORY,
        ConsumidorStockMayorService,
        CalculadoraPreciosMayorService,
    ],
})
export class VentasMayorModule {}