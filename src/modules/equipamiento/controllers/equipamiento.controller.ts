import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Query,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    UseGuards,
    UnauthorizedException,
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
    SolicitarEquipamientoDto,
    ReportarDanoDto,
    QueryEquipamientosDto,
    EquipamientoResponseDto,
    EquipamientosPaginadosDto,
} from '../application/dto';

// Commands
import {
    SolicitarEquipamientoCommand,
    ActivarEquipamientoCommand,
    PagarMensualidadCommand,
    ReportarDanoCommand,
    ReportarPerdidaCommand,
    PagarDanoCommand,
    DevolverEquipamientoCommand,
} from '../application/commands';

// Queries
import {
    ObtenerEquipamientoQuery,
    ObtenerMiEquipamientoQuery,
    ListarEquipamientosQuery,
} from '../application/queries';

/**
 * Controlador de Equipamiento
 * Según sección 20.11 del documento
 */
@ApiTags('Equipamiento')
@ApiBearerAuth('access-token')
@Controller('equipamiento')
export class EquipamientoController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * POST /equipamiento/solicitar
   * Solicitar equipamiento
   */
  @Post('solicitar')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Solicitar equipamiento' })
  @ApiResponse({ status: 201, type: EquipamientoResponseDto })
  async solicitar(
    @Body() dto: SolicitarEquipamientoDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EquipamientoResponseDto> {
    if (!user) throw new UnauthorizedException();

    const equipamiento = await this.commandBus.execute(
      new SolicitarEquipamientoCommand(user.id, dto.tieneDeposito),
    );
    return this.queryBus.execute(new ObtenerEquipamientoQuery(equipamiento.id));
  }

  /**
   * GET /equipamiento
   * Listar equipamiento (admin)
   */
  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar equipamiento (admin)' })
  @ApiResponse({ status: 200, type: EquipamientosPaginadosDto })
  async listar(
    @Query() queryDto: QueryEquipamientosDto,
  ): Promise<EquipamientosPaginadosDto> {
    return this.queryBus.execute(new ListarEquipamientosQuery(queryDto));
  }

  /**
   * GET /equipamiento/me
   * Obtener mi equipamiento
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Obtener mi equipamiento' })
  @ApiResponse({ status: 200, type: EquipamientoResponseDto })
  async obtenerMio(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EquipamientoResponseDto | null> {
    if (!user) throw new UnauthorizedException();

    return this.queryBus.execute(new ObtenerMiEquipamientoQuery(user.id));
  }

  /**
   * POST /equipamiento/:id/activar
   * Activar equipamiento (admin)
   */
  @Post(':id/activar')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activar equipamiento (admin)' })
  @ApiParam({ name: 'id', description: 'ID del equipamiento' })
  @ApiResponse({ status: 200, type: EquipamientoResponseDto })
  async activar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<EquipamientoResponseDto> {
    if (!admin) throw new UnauthorizedException();

    await this.commandBus.execute(new ActivarEquipamientoCommand(id, admin.id));
    return this.queryBus.execute(new ObtenerEquipamientoQuery(id));
  }

  /**
   * POST /equipamiento/:id/pagar-mensualidad
   * Registrar pago mensualidad
   */
  @Post(':id/pagar-mensualidad')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar pago mensualidad' })
  @ApiParam({ name: 'id', description: 'ID del equipamiento' })
  @ApiResponse({ status: 200, type: EquipamientoResponseDto })
  async pagarMensualidad(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EquipamientoResponseDto> {
    await this.commandBus.execute(new PagarMensualidadCommand(id));
    return this.queryBus.execute(new ObtenerEquipamientoQuery(id));
  }

  /**
   * POST /equipamiento/:id/reportar-dano
   * Reportar daño (admin)
   */
  @Post(':id/reportar-dano')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reportar daño (admin)' })
  @ApiParam({ name: 'id', description: 'ID del equipamiento' })
  @ApiResponse({ status: 200, type: EquipamientoResponseDto })
  async reportarDano(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReportarDanoDto,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<EquipamientoResponseDto> {
    if (!admin) throw new UnauthorizedException();

    await this.commandBus.execute(
      new ReportarDanoCommand(id, dto.tipoDano, admin.id),
    );
    return this.queryBus.execute(new ObtenerEquipamientoQuery(id));
  }

  /**
   * POST /equipamiento/:id/reportar-perdida
   * Reportar pérdida (admin)
   */
  @Post(':id/reportar-perdida')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reportar pérdida (admin)' })
  @ApiParam({ name: 'id', description: 'ID del equipamiento' })
  @ApiResponse({ status: 200, type: EquipamientoResponseDto })
  async reportarPerdida(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<EquipamientoResponseDto> {
    if (!admin) throw new UnauthorizedException();

    await this.commandBus.execute(new ReportarPerdidaCommand(id, admin.id));
    return this.queryBus.execute(new ObtenerEquipamientoQuery(id));
  }

  /**
   * POST /equipamiento/:id/pagar-dano
   * Registrar pago de daño
   */
  @Post(':id/pagar-dano')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar pago de daño' })
  @ApiParam({ name: 'id', description: 'ID del equipamiento' })
  @ApiResponse({ status: 200, type: EquipamientoResponseDto })
  async pagarDano(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EquipamientoResponseDto> {
    await this.commandBus.execute(new PagarDanoCommand(id));
    return this.queryBus.execute(new ObtenerEquipamientoQuery(id));
  }
    /**
     * POST /equipamiento/:id/devolver
     * Devolver equipamiento
     */
    @Post(':id/devolver')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Devolver equipamiento' })
    @ApiParam({ name: 'id', description: 'ID del equipamiento' })
    @ApiResponse({ status: 200, type: EquipamientoResponseDto })
    async devolver(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<EquipamientoResponseDto> {
        await this.commandBus.execute(new DevolverEquipamientoCommand(id));
        return this.queryBus.execute(new ObtenerEquipamientoQuery(id));
    }
}
