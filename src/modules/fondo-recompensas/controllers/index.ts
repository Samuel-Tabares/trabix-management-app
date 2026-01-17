import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Decimal } from 'decimal.js';
import { CurrentUser, AuthenticatedUser, Roles } from '@/modules';

// DTOs
import {
  RegistrarSalidaDto,
  QueryTransaccionesDto,
  SaldoFondoResponseDto,
  TransaccionesPaginadasDto,
  MovimientoFondoResponseDto,
} from '../application/dto';

// Commands
import { RegistrarSalidaFondoCommand } from '../application/commands';

// Queries
import {
  ObtenerSaldoFondoQuery,
  ListarTransaccionesFondoQuery,
} from '../application/queries';

/**
 * Controlador del Fondo de Recompensas
 * Según sección 20.12 del documento
 */
@ApiTags('Fondo Recompensas')
@ApiBearerAuth('access-token')
@Controller('fondo-recompensas')
export class FondoRecompensasController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * GET /fondo-recompensas/saldo
   * Obtener saldo actual
   */
  @Get('saldo')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obtener saldo actual' })
  @ApiResponse({ status: 200, type: SaldoFondoResponseDto })
  async obtenerSaldo(): Promise<SaldoFondoResponseDto> {
    return this.queryBus.execute(new ObtenerSaldoFondoQuery());
  }

  /**
   * GET /fondo-recompensas/transacciones
   * Listar transacciones
   */
  @Get('transacciones')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar transacciones' })
  @ApiResponse({ status: 200, type: TransaccionesPaginadasDto })
  async listarTransacciones(
    @Query() queryDto: QueryTransaccionesDto,
  ): Promise<TransaccionesPaginadasDto> {
    return this.queryBus.execute(new ListarTransaccionesFondoQuery(queryDto));
  }

  /**
   * POST /fondo-recompensas/salida
   * Registrar salida (admin)
   */
  @Post('salida')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar salida (admin)' })
  @ApiResponse({ status: 201, type: MovimientoFondoResponseDto })
  async registrarSalida(
    @Body() dto: RegistrarSalidaDto,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<MovimientoFondoResponseDto> {
    const movimiento = await this.commandBus.execute(
      new RegistrarSalidaFondoCommand(
        new Decimal(dto.monto),
        dto.concepto,
        admin.id,
      ),
    );

    return {
      id: movimiento.id,
      tipo: movimiento.tipo,
      monto: Number.parseFloat(movimiento.monto.toFixed(2)),
      concepto: movimiento.concepto,
      fechaTransaccion: movimiento.fechaTransaccion,
    };
  }
}
