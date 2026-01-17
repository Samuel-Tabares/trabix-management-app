import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
    // Auth / User
    CurrentUser,
    AuthenticatedUser,
    Roles,

    // DTOs
    CreateLoteDto,
    QueryLotesDto,
    LoteResponseDto,
    LotesPaginadosDto,
    ResumenFinancieroDto,

    // Commands
    CrearLoteCommand,
    ActivarLoteCommand,

    // Queries
    ObtenerLoteQuery,
    ListarLotesQuery,
    ResumenFinancieroQuery,
} from '@/modules';


/**
 * Controlador de Lotes
 * Según sección 20.4 del documento
 * 
 * Endpoints:
 * - POST /        - Crear lote (admin)
 * - GET /         - Listar lotes
 * - GET /:id      - Obtener lote
 * - POST /:id/activar - Activar lote (admin)
 * - GET /:id/resumen-financiero - Resumen financiero
 */
@ApiTags('Lotes')
@ApiBearerAuth('access-token')
@Controller('lotes')
export class LotesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * POST /lotes
   * Crea un nuevo lote (solo admin)
   */
  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear lote (admin)' })
  @ApiResponse({
    status: 201,
    description: 'Lote creado exitosamente',
    type: LoteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Vendedor no encontrado' })
  async crear(
    @Body() createDto: CreateLoteDto,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<LoteResponseDto> {
    const lote = await this.commandBus.execute(
      new CrearLoteCommand(createDto, admin.id),
    );
    return this.queryBus.execute(new ObtenerLoteQuery(lote.id));
  }

  /**
   * GET /lotes
   * Lista lotes con filtros y paginación
   */
  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar lotes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de lotes',
    type: LotesPaginadosDto,
  })
  async listar(
    @Query() queryDto: QueryLotesDto,
  ): Promise<LotesPaginadosDto> {
    return this.queryBus.execute(new ListarLotesQuery(queryDto));
  }

  /**
   * GET /lotes/:id
   * Obtiene un lote por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener lote' })
  @ApiParam({ name: 'id', description: 'ID del lote' })
  @ApiResponse({
    status: 200,
    description: 'Datos del lote',
    type: LoteResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Lote no encontrado' })
  async obtener(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LoteResponseDto> {

    // TODO: Verificar que el usuario puede ver este lote (admin o dueño)

    return this.queryBus.execute(new ObtenerLoteQuery(id));
  }

  /**
   * POST /lotes/:id/activar
   * Activa un lote (admin confirma pago de inversión)
   */
  @Post(':id/activar')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activar lote (admin)' })
  @ApiParam({ name: 'id', description: 'ID del lote' })
  @ApiResponse({
    status: 200,
    description: 'Lote activado exitosamente',
    type: LoteResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Lote no encontrado' })
  @ApiResponse({ status: 409, description: 'Lote ya está activo' })
  async activar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<LoteResponseDto> {
    await this.commandBus.execute(new ActivarLoteCommand(id, admin.id));
    return this.queryBus.execute(new ObtenerLoteQuery(id));
  }

  /**
   * GET /lotes/:id/resumen-financiero
   * Obtiene el resumen financiero de un lote
   */
  @Get(':id/resumen-financiero')
  @ApiOperation({ summary: 'Resumen financiero del lote' })
  @ApiParam({ name: 'id', description: 'ID del lote' })
  @ApiResponse({
    status: 200,
    description: 'Resumen financiero',
    type: ResumenFinancieroDto,
  })
  @ApiResponse({ status: 404, description: 'Lote no encontrado' })
  async resumenFinanciero(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResumenFinancieroDto> {

    // TODO: Verificar que el usuario puede ver este resumen

    return this.queryBus.execute(new ResumenFinancieroQuery(id));
  }
}
