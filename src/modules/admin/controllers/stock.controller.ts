import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';

// DTOs
import {
  CrearPedidoStockDto,
  AgregarCostoDto,
  QueryPedidosDto,
  CancelarPedidoDto,
  PedidoStockResponseDto,
  StockAdminResponseDto,
  DeficitResponseDto,
} from '../application/dto';

// Commands
import {
  CrearPedidoStockCommand,
  AgregarCostoPedidoCommand,
  EliminarCostoPedidoCommand,
  ConfirmarPedidoStockCommand,
  RecibirPedidoStockCommand,
  CancelarPedidoStockCommand,
} from '../application/commands';

// Queries
import {
  ObtenerPedidoStockQuery,
  ListarPedidosStockQuery,
  ObtenerStockAdminQuery,
  ObtenerDeficitQuery,
} from '../application/queries';

/**
 * Controller de Stock Admin
 * Según sección 20.15 del documento
 *
 * Endpoints:
 * - GET /admin/stock           - Estado actual del stock
 * - GET /admin/stock/deficit   - Calcular déficit
 * - GET /admin/stock/reservado - Desglose de stock reservado
 */
@ApiTags('Admin - Stock')
@ApiBearerAuth('access-token')
@Controller('admin/stock')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
export class StockAdminController {
  constructor(private readonly queryBus: QueryBus) {}

  /**
   * GET /admin/stock
   * Obtener estado actual del stock
   */
  @Get()
  @ApiOperation({ summary: 'Obtener estado actual del stock' })
  @ApiResponse({ status: 200, type: StockAdminResponseDto })
  async obtenerStock(): Promise<StockAdminResponseDto> {
    return this.queryBus.execute(new ObtenerStockAdminQuery());
  }

  /**
   * GET /admin/stock/deficit
   * Calcular déficit actual
   */
  @Get('deficit')
  @ApiOperation({ summary: 'Calcular déficit actual' })
  @ApiResponse({ status: 200, type: DeficitResponseDto })
  async obtenerDeficit(): Promise<DeficitResponseDto> {
    return this.queryBus.execute(new ObtenerDeficitQuery());
  }

  /**
   * GET /admin/stock/reservado
   * Ver desglose de stock reservado
   */
//TODO:
}

/**
 * Controller de Pedidos de Stock
 * Según sección 20.16 del documento
 *
 * Endpoints:
 * - POST /admin/pedidos-stock              - Crear pedido (BORRADOR)
 * - GET  /admin/pedidos-stock              - Listar pedidos
 * - GET  /admin/pedidos-stock/:id          - Obtener pedido
 * - POST /admin/pedidos-stock/:id/costos   - Agregar costo
 * - DELETE /admin/pedidos-stock/:id/costos/:costoId - Eliminar costo
 * - POST /admin/pedidos-stock/:id/confirmar - Confirmar pedido
 * - POST /admin/pedidos-stock/:id/recibir   - Marcar como recibido
 * - POST /admin/pedidos-stock/:id/cancelar  - Cancelar pedido
 */
@ApiTags('Admin - Pedidos Stock')
@ApiBearerAuth('access-token')
@Controller('admin/pedidos-stock')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
export class PedidosStockController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * POST /admin/pedidos-stock
   * Crear nuevo pedido (estado BORRADOR)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nuevo pedido (estado BORRADOR)' })
  @ApiResponse({ status: 201, type: PedidoStockResponseDto })
  async crear(@Body() dto: CrearPedidoStockDto): Promise<PedidoStockResponseDto> {
    const pedido = await this.commandBus.execute(
      new CrearPedidoStockCommand(dto.cantidadTrabix, dto.notas),
    );
    return this.queryBus.execute(new ObtenerPedidoStockQuery(pedido.id));
  }

  /**
   * GET /admin/pedidos-stock
   * Listar todos los pedidos
   */
  @Get()
  @ApiOperation({ summary: 'Listar todos los pedidos' })
  async listar(@Query() queryDto: QueryPedidosDto): Promise<any> {
    return this.queryBus.execute(
      new ListarPedidosStockQuery(queryDto.estado, queryDto.skip, queryDto.take),
    );
  }

  /**
   * GET /admin/pedidos-stock/:id
   * Obtener pedido con detalles de costos
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener pedido con detalles de costos' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ status: 200, type: PedidoStockResponseDto })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  async obtener(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PedidoStockResponseDto> {
    return this.queryBus.execute(new ObtenerPedidoStockQuery(id));
  }

  /**
   * POST /admin/pedidos-stock/:id/costos
   * Agregar detalle de costo al pedido
   */
  @Post(':id/costos')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Agregar detalle de costo al pedido' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ status: 201, type: PedidoStockResponseDto })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({ status: 409, description: 'Pedido no está en estado BORRADOR' })
  async agregarCosto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AgregarCostoDto,
  ): Promise<PedidoStockResponseDto> {
    await this.commandBus.execute(
      new AgregarCostoPedidoCommand(
        id,
        dto.concepto,
        dto.esObligatorio,
        dto.costoTotal,
        dto.cantidad,
      ),
    );
    return this.queryBus.execute(new ObtenerPedidoStockQuery(id));
  }

  /**
   * DELETE /admin/pedidos-stock/:id/costos/:costoId
   * Eliminar detalle de costo (solo en BORRADOR)
   */
  @Delete(':id/costos/:costoId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar detalle de costo (solo en BORRADOR)' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiParam({ name: 'costoId', description: 'ID del costo' })
  @ApiResponse({ status: 200, type: PedidoStockResponseDto })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({ status: 409, description: 'Pedido no está en estado BORRADOR' })
  async eliminarCosto(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('costoId', ParseUUIDPipe) costoId: string,
  ): Promise<PedidoStockResponseDto> {
    await this.commandBus.execute(new EliminarCostoPedidoCommand(id, costoId));
    return this.queryBus.execute(new ObtenerPedidoStockQuery(id));
  }

  /**
   * POST /admin/pedidos-stock/:id/confirmar
   * Confirmar pedido (calcula costo real, pasa a CONFIRMADO)
   */
  @Post(':id/confirmar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar pedido (calcula costo real)' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ status: 200, type: PedidoStockResponseDto })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Pedido no está en BORRADOR o faltan insumos obligatorios',
  })
  async confirmar(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PedidoStockResponseDto> {
    await this.commandBus.execute(new ConfirmarPedidoStockCommand(id));
    return this.queryBus.execute(new ObtenerPedidoStockQuery(id));
  }

  /**
   * POST /admin/pedidos-stock/:id/recibir
   * Marcar como recibido (incrementa stock físico)
   */
  @Post(':id/recibir')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar como recibido (incrementa stock físico)' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ status: 200, type: PedidoStockResponseDto })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({ status: 409, description: 'Pedido no está en estado CONFIRMADO' })
  async recibir(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PedidoStockResponseDto> {
    await this.commandBus.execute(new RecibirPedidoStockCommand(id));
    return this.queryBus.execute(new ObtenerPedidoStockQuery(id));
  }

  /**
   * POST /admin/pedidos-stock/:id/cancelar
   * Cancelar pedido (solo en BORRADOR)
   */
  @Post(':id/cancelar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar pedido (solo en BORRADOR)' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ status: 200, type: PedidoStockResponseDto })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({ status: 409, description: 'Pedido no está en estado BORRADOR' })
  async cancelar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelarPedidoDto,
  ): Promise<PedidoStockResponseDto> {
    await this.commandBus.execute(new CancelarPedidoStockCommand(id, dto.motivo));
    return this.queryBus.execute(new ObtenerPedidoStockQuery(id));
  }
}
