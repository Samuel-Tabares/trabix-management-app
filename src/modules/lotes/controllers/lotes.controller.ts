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
  UseGuards,
  UnauthorizedException,
  ForbiddenException,
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
import { CurrentUser, AuthenticatedUser } from '../../auth/decorators/current-user.decorator';

// DTOs
import {
  CreateLoteDto,
  SolicitarLoteDto,
  InfoSolicitudLoteDto,
  QueryLotesDto,
  LoteResponseDto,
  LotesPaginadosDto,
  ResumenFinancieroDto,
} from '../application/dto';

// Commands
import {
  CrearLoteCommand,
  SolicitarLoteCommand,
  CancelarLoteCommand,
  ActivarLoteCommand,
} from '../application/commands';

// Queries
import {
  ObtenerLoteQuery,
  ListarLotesQuery,
  ListarMisLotesQuery,
  ObtenerInfoSolicitudQuery,
  ResumenFinancieroQuery,
} from '../application/queries';

/**
 * Controlador de Lotes
 * Según sección 20.4 del documento
 *
 * Endpoints:
 * - POST /              - Crear lote (admin)
 * - POST /solicitar     - Solicitar lote (vendedor)
 * - GET  /info-solicitud - Obtener info para solicitar (vendedor)
 * - GET  /              - Listar todos los lotes (admin)
 * - GET  /mis-lotes     - Listar mis lotes (vendedor)
 * - GET  /:id           - Obtener lote (admin o dueño)
 * - POST /:id/activar   - Activar lote (admin)
 * - POST /:id/cancelar  - Cancelar solicitud (admin o dueño)
 * - GET  /:id/resumen-financiero - Resumen financiero (admin o dueño)
 */
@ApiTags('Lotes')
@ApiBearerAuth('access-token')
@Controller('lotes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class LotesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ==================== ENDPOINTS ADMIN ====================

  /**
   * POST /lotes
   * Crea un nuevo lote directamente (solo admin)
   * Útil para casos especiales donde el admin crea el lote sin solicitud previa
   */
  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear lote (admin)',
    description: 'Crea un lote directamente para un vendedor. El lote queda en estado CREADO.',
  })
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
    if (!admin) throw new UnauthorizedException();

    const lote = await this.commandBus.execute(
      new CrearLoteCommand(createDto, admin.id),
    );
    return this.queryBus.execute(new ObtenerLoteQuery(lote.id));
  }

  /**
   * GET /lotes
   * Lista todos los lotes (solo admin)
   */
  @Get()
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Listar todos los lotes (admin)',
    description: 'Lista todos los lotes del sistema con filtros y paginación.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de lotes',
    type: LotesPaginadosDto,
  })
  async listar(@Query() queryDto: QueryLotesDto): Promise<LotesPaginadosDto> {
    return this.queryBus.execute(new ListarLotesQuery(queryDto));
  }

  /**
   * POST /lotes/:id/activar
   * Activa un lote (admin confirma pago de inversión)
   */
  @Post(':id/activar')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activar lote (admin)',
    description:
      'Activa un lote después de confirmar el pago de inversión. ' +
      'Libera la primera tanda y crea los cuadres correspondientes.',
  })
  @ApiParam({ name: 'id', description: 'ID del lote' })
  @ApiResponse({
    status: 200,
    description: 'Lote activado exitosamente',
    type: LoteResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Lote no encontrado' })
  @ApiResponse({ status: 409, description: 'Lote no está en estado CREADO' })
  async activar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<LoteResponseDto> {
    if (!admin) throw new UnauthorizedException();

    await this.commandBus.execute(new ActivarLoteCommand(id, admin.id));
    return this.queryBus.execute(new ObtenerLoteQuery(id));
  }

  // ==================== ENDPOINTS VENDEDOR ====================

  /**
   * POST /lotes/solicitar
   * Solicita un nuevo lote (vendedor)
   */
  @Post('solicitar')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Solicitar lote (vendedor)',
    description:
      'Solicita un nuevo lote. Máximo 2 lotes en estado CREADO. ' +
      'La cantidad mínima se calcula para alcanzar una inversión de $20,000.',
  })
  @ApiResponse({
    status: 201,
    description: 'Lote solicitado exitosamente',
    type: LoteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o cantidad insuficiente' })
  @ApiResponse({ status: 409, description: 'Ya tiene el máximo de lotes pendientes' })
  async solicitar(
    @Body() dto: SolicitarLoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LoteResponseDto> {
    if (!user) throw new UnauthorizedException();

    const lote = await this.commandBus.execute(
      new SolicitarLoteCommand(user.id, dto.cantidadTrabix),
    );
    return this.queryBus.execute(new ObtenerLoteQuery(lote.id));
  }

  /**
   * GET /lotes/info-solicitud
   * Obtiene información necesaria antes de solicitar un lote
   */
  @Get('info-solicitud')
  @ApiOperation({
    summary: 'Obtener información para solicitar lote',
    description:
      'Retorna la cantidad mínima de TRABIX, costos, y si puede solicitar más lotes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Información de solicitud',
    type: InfoSolicitudLoteDto,
  })
  async obtenerInfoSolicitud(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<InfoSolicitudLoteDto> {
    if (!user) throw new UnauthorizedException();

    return this.queryBus.execute(new ObtenerInfoSolicitudQuery(user.id));
  }

  /**
   * GET /lotes/mis-lotes
   * Lista los lotes del vendedor autenticado
   */
  @Get('mis-lotes')
  @ApiOperation({
    summary: 'Listar mis lotes (vendedor)',
    description: 'Lista todos los lotes del vendedor autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de lotes del vendedor',
    type: LotesPaginadosDto,
  })
  async listarMisLotes(
    @Query() queryDto: QueryLotesDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LotesPaginadosDto> {
    if (!user) throw new UnauthorizedException();

    return this.queryBus.execute(new ListarMisLotesQuery(user.id, queryDto));
  }

  // ==================== ENDPOINTS COMPARTIDOS ====================

  /**
   * GET /lotes/:id
   * Obtiene un lote por ID
   * Admin puede ver cualquier lote, vendedor solo los suyos
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener lote',
    description: 'Obtiene los datos de un lote. Admin ve cualquiera, vendedor solo los suyos.',
  })
  @ApiParam({ name: 'id', description: 'ID del lote' })
  @ApiResponse({
    status: 200,
    description: 'Datos del lote',
    type: LoteResponseDto,
  })
  @ApiResponse({ status: 403, description: 'No tiene permisos para ver este lote' })
  @ApiResponse({ status: 404, description: 'Lote no encontrado' })
  async obtener(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LoteResponseDto> {
    if (!user) throw new UnauthorizedException();

    const lote = await this.queryBus.execute(new ObtenerLoteQuery(id));

    // Verificar permisos: admin puede ver cualquiera, vendedor solo los suyos
    if (user.rol !== 'ADMIN' && lote.vendedorId !== user.id) {
      throw new ForbiddenException('No tiene permisos para ver este lote');
    }

    return lote;
  }

  /**
   * POST /lotes/:id/cancelar
   * Cancela una solicitud de lote (solo en estado CREADO)
   * Admin puede cancelar cualquiera, vendedor solo los suyos
   */
  @Post(':id/cancelar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar solicitud de lote',
    description:
      'Cancela un lote en estado CREADO. Admin puede cancelar cualquiera, ' +
      'vendedor solo los suyos.',
  })
  @ApiParam({ name: 'id', description: 'ID del lote' })
  @ApiResponse({
    status: 200,
    description: 'Lote cancelado',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'No tiene permisos para cancelar este lote' })
  @ApiResponse({ status: 404, description: 'Lote no encontrado' })
  @ApiResponse({ status: 409, description: 'El lote no está en estado CREADO' })
  async cancelar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    if (!user) throw new UnauthorizedException();

    return this.commandBus.execute(
      new CancelarLoteCommand(id, user.id, user.rol === 'ADMIN'),
    );
  }

  /**
   * GET /lotes/:id/resumen-financiero
   * Obtiene el resumen financiero de un lote
   * Admin puede ver cualquiera, vendedor solo los suyos
   */
  @Get(':id/resumen-financiero')
  @ApiOperation({
    summary: 'Resumen financiero del lote',
    description:
      'Obtiene métricas financieras detalladas del lote. ' +
      'Admin ve cualquiera, vendedor solo los suyos.',
  })
  @ApiParam({ name: 'id', description: 'ID del lote' })
  @ApiResponse({
    status: 200,
    description: 'Resumen financiero',
    type: ResumenFinancieroDto,
  })
  @ApiResponse({ status: 403, description: 'No tiene permisos para ver este resumen' })
  @ApiResponse({ status: 404, description: 'Lote no encontrado' })
  async resumenFinanciero(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ResumenFinancieroDto> {
    if (!user) throw new UnauthorizedException();

    // Primero obtenemos el lote para verificar propiedad
    const lote = await this.queryBus.execute(new ObtenerLoteQuery(id));

    // Verificar permisos
    if (user.rol !== 'ADMIN' && lote.vendedorId !== user.id) {
      throw new ForbiddenException('No tiene permisos para ver este resumen financiero');
    }

    return this.queryBus.execute(new ResumenFinancieroQuery(id));
  }
}
