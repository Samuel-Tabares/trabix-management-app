import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Domain
import {
  VENTA_REPOSITORY,
  VendedorPuedeVenderSpecification,
  RegaloPermitidoSpecification,
} from './domain';

// Infrastructure
import { PrismaVentaRepository } from './infrastructure';

// Application - Commands, Queries, Events
import { VentaCommandHandlers } from './application/commands';
import { VentaQueryHandlers } from './application/queries';
import { VentaEventHandlers } from './application/events';

// Controllers
import { VentasController } from './controllers';

// Módulos necesarios
import { LotesModule, UsuariosModule } from '@/modules';
import { CuadresModule } from '@modules/cuadres';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

/**
 * Módulo de Ventas
 * Según sección 6 del documento
 * 
 * Responsabilidades:
 * - Registro de ventas al detal
 * - Aprobación/Rechazo de ventas
 * - Gestión de stock
 * - Validación de regalos
 * 
 * Flujo de venta:
 * 1. Vendedor registra venta colectiva (PENDIENTE)
 * 2. Stock se reduce temporalmente
 * 3. Admin revisa:
 *    - Si APRUEBA: stock definitivo, genera recaudo
 *    - Si RECHAZA: stock se revierte, venta se elimina
 */
@Module({
  imports: [
    CqrsModule,
    UsuariosModule,
    LotesModule,
    forwardRef(() => CuadresModule),
    forwardRef(() => NotificacionesModule),
  ],
  controllers: [VentasController],
  providers: [
    // Repository
    {
      provide: VENTA_REPOSITORY,
      useClass: PrismaVentaRepository,
    },
    
    // Specifications
    VendedorPuedeVenderSpecification,
    RegaloPermitidoSpecification,
    
    // Command Handlers
    ...VentaCommandHandlers,
    
    // Query Handlers
    ...VentaQueryHandlers,
    
    // Event Handlers
    ...VentaEventHandlers,
  ],
  exports: [
    VENTA_REPOSITORY,
  ],
})
export class VentasModule {}
