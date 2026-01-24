import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';

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
 *
 * Endpoints:
 * - GET /admin/dashboard/resumen           - Resumen general
 * - GET /admin/dashboard/ventas-periodo    - Ventas por período
 * - GET /admin/dashboard/vendedores-activos - Cantidad de vendedores activos
 * - GET /admin/dashboard/cuadres-pendientes - Lista de cuadres pendientes
 */
@ApiTags('Admin - Dashboard')
@ApiBearerAuth('access-token')
@Controller('admin/dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
export class DashboardController {
  constructor(private readonly queryBus: QueryBus) {}

  /**
   * GET /admin/dashboard/resumen
   * Resumen general (ventas, stock, cuadres pendientes)
   */
  @Get('resumen')
  @ApiOperation({
    summary: 'Resumen general (ventas, stock, cuadres pendientes)',
  })
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
  @ApiQuery({
    name: 'periodo',
    enum: ['dia', 'semana', 'mes'],
    required: true,
    description: 'Período a consultar',
  })
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
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        cantidad: { type: 'number', description: 'Cantidad de vendedores activos' },
      },
    },
  })
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
