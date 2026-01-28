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
    ReportarDanoCommand,
    ReportarPerdidaCommand,
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
 * Según sección 10 del documento
 *
 * Permisos:
 * - VENDEDOR: solo puede solicitar y ver su propio equipamiento
 * - ADMIN: puede listar, activar, reportar daños/pérdidas, y marcar devoluciones
 */
@ApiTags('Equipamiento')
@ApiBearerAuth('access-token')
@Controller('equipamiento')
@UseGuards(AuthGuard('jwt'))
export class EquipamientoController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    // =============================================
    // ENDPOINTS PARA VENDEDOR
    // =============================================

    /**
     * POST /equipamiento/solicitar
     * Solicitar equipamiento (VENDEDOR)
     */
    @Post('solicitar')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Solicitar equipamiento (vendedor)',
        description: 'Un vendedor solicita equipamiento (nevera + pijama). Solo puede tener uno activo.',
    })
    @ApiResponse({ status: 201, type: EquipamientoResponseDto })
    @ApiResponse({ status: 400, description: 'Ya tiene equipamiento activo' })
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
     * GET /equipamiento/me
     * Obtener mi equipamiento (VENDEDOR)
     */
    @Get('me')
    @ApiOperation({
        summary: 'Obtener mi equipamiento',
        description: 'Retorna el equipamiento activo del vendedor autenticado',
    })
    @ApiResponse({ status: 200, type: EquipamientoResponseDto })
    @ApiResponse({ status: 404, description: 'No tiene equipamiento' })
    async obtenerMio(
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<EquipamientoResponseDto | null> {
        if (!user) throw new UnauthorizedException();

        return this.queryBus.execute(new ObtenerMiEquipamientoQuery(user.id));
    }

    // =============================================
    // ENDPOINTS PARA ADMIN
    // =============================================

    /**
     * GET /equipamiento
     * Listar equipamiento (ADMIN)
     */
    @Get()
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({
        summary: 'Listar equipamiento (admin)',
        description: 'Lista todos los equipamientos con filtros opcionales',
    })
    @ApiResponse({ status: 200, type: EquipamientosPaginadosDto })
    async listar(
        @Query() queryDto: QueryEquipamientosDto,
    ): Promise<EquipamientosPaginadosDto> {
        return this.queryBus.execute(new ListarEquipamientosQuery(queryDto));
    }

    /**
     * GET /equipamiento/:id
     * Obtener detalle de equipamiento (ADMIN)
     */
    @Get(':id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({
        summary: 'Obtener detalle de equipamiento (admin)',
        description: 'Obtiene el detalle completo de un equipamiento por ID',
    })
    @ApiParam({ name: 'id', description: 'ID del equipamiento' })
    @ApiResponse({ status: 200, type: EquipamientoResponseDto })
    @ApiResponse({ status: 404, description: 'Equipamiento no encontrado' })
    async obtenerPorId(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<EquipamientoResponseDto> {
        return this.queryBus.execute(new ObtenerEquipamientoQuery(id));
    }

    /**
     * POST /equipamiento/:id/activar
     * Activar equipamiento - marcar como entregado (ADMIN)
     */
    @Post(':id/activar')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Activar equipamiento (admin)',
        description: 'Admin confirma la entrega física del equipamiento al vendedor',
    })
    @ApiParam({ name: 'id', description: 'ID del equipamiento' })
    @ApiResponse({ status: 200, type: EquipamientoResponseDto })
    @ApiResponse({ status: 400, description: 'Estado inválido para activación' })
    async activar(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() admin: AuthenticatedUser,
    ): Promise<EquipamientoResponseDto> {
        if (!admin) throw new UnauthorizedException();

        await this.commandBus.execute(new ActivarEquipamientoCommand(id, admin.id));
        return this.queryBus.execute(new ObtenerEquipamientoQuery(id));
    }

    /**
     * POST /equipamiento/:id/reportar-dano
     * Reportar daño (ADMIN)
     */
    @Post(':id/reportar-dano')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Reportar daño (admin)',
        description:
            'Admin reporta daño de nevera ($30,000) o pijama ($60,000). ' +
            'Solo aumenta la deuda, no cambia el estado.',
    })
    @ApiParam({ name: 'id', description: 'ID del equipamiento' })
    @ApiResponse({ status: 200, type: EquipamientoResponseDto })
    @ApiResponse({ status: 400, description: 'Estado inválido para reportar daño' })
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
     * Reportar pérdida total (ADMIN)
     */
    @Post(':id/reportar-perdida')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Reportar pérdida total (admin)',
        description:
            'Admin reporta pérdida total del equipamiento. ' +
            'Genera deuda por el costo total ($90,000) y cambia estado a PERDIDO.',
    })
    @ApiParam({ name: 'id', description: 'ID del equipamiento' })
    @ApiResponse({ status: 200, type: EquipamientoResponseDto })
    @ApiResponse({ status: 400, description: 'Estado inválido para reportar pérdida' })
    async reportarPerdida(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() admin: AuthenticatedUser,
    ): Promise<EquipamientoResponseDto> {
        if (!admin) throw new UnauthorizedException();

        await this.commandBus.execute(new ReportarPerdidaCommand(id, admin.id));
        return this.queryBus.execute(new ObtenerEquipamientoQuery(id));
    }

    /**
     * POST /equipamiento/:id/devolver
     * Devolver equipamiento (ADMIN)
     */
    @Post(':id/devolver')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Devolver equipamiento (admin)',
        description:
            'Admin registra la devolución del equipamiento. ' +
            'Solo si no hay deudas pendientes. Si tiene depósito, se devuelve.',
    })
    @ApiParam({ name: 'id', description: 'ID del equipamiento' })
    @ApiResponse({ status: 200, type: EquipamientoResponseDto })
    @ApiResponse({ status: 400, description: 'Tiene deudas pendientes o estado inválido' })
    async devolver(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() admin: AuthenticatedUser,
    ): Promise<EquipamientoResponseDto> {
        if (!admin) throw new UnauthorizedException();

        await this.commandBus.execute(new DevolverEquipamientoCommand(id, admin.id));
        return this.queryBus.execute(new ObtenerEquipamientoQuery(id));
    }
}