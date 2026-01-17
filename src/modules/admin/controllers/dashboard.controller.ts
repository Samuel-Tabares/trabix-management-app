import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';
import { Roles } from '@/modules';

// DTOs
import {
  ResumenDashboardDto,
  VentasPeriodoDto,
  CuadrePendienteResumenDto,
} from '../application/dto';

// Queries
import {
  ResumenDashboardQuery,
  VentasPeriodoQuery,
  VendedoresActivosQuery,
  CuadresPendientesQuery,
} from '../application/queries';

/**
 * Controller de Dashboard Admin
 * Según sección 20.19 del documento
 */
@ApiTags('Admin - Dashboard')
@ApiBearerAuth('access-token')
@Controller('admin/dashboard')
@Roles('ADMIN')
export class DashboardController {
  constructor(private readonly queryBus: QueryBus) {}

  /**
   * GET /admin/dashboard/resumen
   * Resumen general (ventas, stock, cuadres pendientes)
   */
  @Get('resumen')
  @ApiOperation({ summary: 'Resumen general (ventas, stock, cuadres pendientes)' })
  @ApiResponse({ status: 200, type: ResumenDashboardDto })
  async obtenerResumen(): Promise<ResumenDashboardDto> {
    return this.queryBus.execute(new ResumenDashboardQuery());
  }

  /**
   * GET /admin/dashboard/ventas-periodo
   * Ventas por período (día/semana/mes)
   */
  @Get('ventas-periodo')
  @ApiOperation({ summary: 'Ventas por período (día/semana/mes)' })
  @ApiQuery({ name: 'periodo', enum: ['dia', 'semana', 'mes'], required: true })
  @ApiResponse({ status: 200, type: VentasPeriodoDto })
  async obtenerVentasPeriodo(
    @Query('periodo') periodo: 'dia' | 'semana' | 'mes',
  ): Promise<VentasPeriodoDto> {
    return this.queryBus.execute(new VentasPeriodoQuery(periodo));
  }

  /**
   * GET /admin/dashboard/vendedores-activos
   * Cantidad de vendedores activos
   */
  @Get('vendedores-activos')
  @ApiOperation({ summary: 'Cantidad de vendedores activos' })
  @ApiResponse({ status: 200, type: Number })
  async obtenerVendedoresActivos(): Promise<{ cantidad: number }> {
    const cantidad = await this.queryBus.execute(new VendedoresActivosQuery());
    return { cantidad };
  }

  /**
   * GET /admin/dashboard/cuadres-pendientes
   * Lista de cuadres pendientes de confirmar
   */
  @Get('cuadres-pendientes')
  @ApiOperation({ summary: 'Lista de cuadres pendientes de confirmar' })
  @ApiResponse({ status: 200, type: [CuadrePendienteResumenDto] })
  async obtenerCuadresPendientes(): Promise<CuadrePendienteResumenDto[]> {
    return this.queryBus.execute(new CuadresPendientesQuery());
  }
}
