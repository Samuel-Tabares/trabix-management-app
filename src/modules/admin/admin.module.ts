import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Controllers
import {
    StockAdminController,
    PedidosStockController,
    ConfiguracionesController,
    TiposInsumoController,
    DashboardController,
} from './controllers';

// Domain
import {
    PEDIDO_STOCK_REPOSITORY,
    CONFIGURACION_REPOSITORY,
    TIPO_INSUMO_REPOSITORY,
    STOCK_ADMIN_REPOSITORY,
} from './domain/repositories';

// Infrastructure
import {
    PrismaPedidoStockRepository,
    PrismaConfiguracionRepository,
    PrismaTipoInsumoRepository,
    PrismaStockAdminRepository,
} from './infrastructure';

// Application
import { AdminCommandHandlers } from './application/commands';
import { AdminQueryHandlers } from './application/queries';

/**
 * Módulo de Admin
 * Según sección 1 y Fase 10 del documento
 * 
 * Gestiona:
 * - Pedidos de stock (CRUD completo con costos)
 * - Configuraciones del sistema (con historial)
 * - Tipos de insumo (obligatorios y adicionales)
 * - Stock del admin (físico, reservado, déficit)
 * - Dashboard con métricas
 */
@Module({
  imports: [CqrsModule],
  controllers: [
    StockAdminController,
    PedidosStockController,
    ConfiguracionesController,
    TiposInsumoController,
    DashboardController,
  ],
  providers: [
    // Repositories
    {
      provide: PEDIDO_STOCK_REPOSITORY,
      useClass: PrismaPedidoStockRepository,
    },
    {
      provide: CONFIGURACION_REPOSITORY,
      useClass: PrismaConfiguracionRepository,
    },
    {
      provide: TIPO_INSUMO_REPOSITORY,
      useClass: PrismaTipoInsumoRepository,
    },
    {
      provide: STOCK_ADMIN_REPOSITORY,
      useClass: PrismaStockAdminRepository,
    },
    // Command Handlers
    ...AdminCommandHandlers,
    // Query Handlers
    ...AdminQueryHandlers,
  ],
  exports: [
    PEDIDO_STOCK_REPOSITORY,
    CONFIGURACION_REPOSITORY,
    TIPO_INSUMO_REPOSITORY,
    STOCK_ADMIN_REPOSITORY,
  ],
})
export class AdminModule {}
