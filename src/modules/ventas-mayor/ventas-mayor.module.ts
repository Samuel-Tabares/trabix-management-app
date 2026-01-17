import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Controllers
import { VentasMayorController } from '@modules/ventas-mayor/controllers';

// Domain
import { VENTA_MAYOR_REPOSITORY, ConsumidorStockMayorService } from '@modules/ventas-mayor/domain';

// Infrastructure
import { PrismaVentaMayorRepository } from '@modules/ventas-mayor/infrastructure';

// Application
import { VentaMayorCommandHandlers } from './application/commands';
import { VentaMayorQueryHandlers } from './application/queries';
import { VentaMayorEventHandlers } from './application/events';

// Related modules
import { LotesModule, UsuariosModule } from '@/modules';
import { CuadresMayorModule } from '../cuadres-mayor/cuadres-mayor.module';
import { CuadresModule } from '@modules/cuadres';

@Module({
  imports: [
    CqrsModule,
    forwardRef(() => LotesModule),
    forwardRef(() => UsuariosModule),
    forwardRef(() => CuadresMayorModule),
    forwardRef(() => CuadresModule),
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
  ],
})
export class VentasMayorModule {}
