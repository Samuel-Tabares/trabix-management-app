import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Controllers
import { VentasMayorController } from './controllers/ventas-mayor.controller';

// Domain
import { ConsumidorStockMayorService } from './domain/consumidor-stock-mayor.service';
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
