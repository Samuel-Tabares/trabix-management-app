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
import { DomainException } from '../../../domain/exceptions/domain.exception';

// DTOs
import {
    CuadreResponseDto,
    CuadresPaginadosDto,
} from '../application/dto/cuadre-response.dto';
import {
    QueryCuadresDto,
} from '../application/dto/query-cuadres.dto';
import {
    ConfirmarCuadreDto,
} from '../application/dto/confirmar-cuadre.dto';

// Commands
import { ConfirmarCuadreCommand } from '../application/commands';

// Queries
import {
    ObtenerCuadreQuery,
    ListarCuadresQuery,
} from '../application/queries';

/**
 * Controlador de Cuadres
 * Según sección 20.8 del documento
 *
 * Endpoints:
 * - GET /         - Listar cuadres
 * - GET /:id      - Obtener cuadre
 * - POST /:id/confirmar - Confirmar cuadre exitoso (admin)
 *
 * Permisos:
 * - Vendedor/Reclutador: solo ve sus propios cuadres
 * - Admin: ve todos los cuadres
 */
@ApiTags('Cuadres')
@ApiBearerAuth('access-token')
@Controller('cuadres')
@UseGuards(AuthGuard('jwt'))
export class CuadresController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    /**
     * GET /cuadres
     * Lista cuadres con filtros y paginación
     */
    @Get()
    @ApiOperation({ summary: 'Listar cuadres' })
    @ApiResponse({
        status: 200,
        description: 'Lista de cuadres',
        type: CuadresPaginadosDto,
    })
    async listar(
        @Query() queryDto: QueryCuadresDto,
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<CuadresPaginadosDto> {
        if (!user) throw new UnauthorizedException();

        // Si no es admin, solo ve sus propios cuadres
        if (user.rol !== 'ADMIN') {
            queryDto.vendedorId = user.id;
        }
        return this.queryBus.execute(new ListarCuadresQuery(queryDto));
    }

    /**
     * GET /cuadres/:id
     * Obtiene un cuadre por ID
     */
    @Get(':id')
    @ApiOperation({ summary: 'Obtener cuadre' })
    @ApiParam({ name: 'id', description: 'ID del cuadre' })
    @ApiResponse({
        status: 200,
        description: 'Datos del cuadre',
        type: CuadreResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Cuadre no encontrado' })
    async obtener(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<CuadreResponseDto> {
        if (!user) throw new UnauthorizedException();

        const cuadre = await this.queryBus.execute(new ObtenerCuadreQuery(id));

        // Verificar acceso: admin o dueño del cuadre (a través del lote)
        // El cuadre pertenece a una tanda, que pertenece a un lote, que tiene un vendedor
        if (user.rol !== 'ADMIN') {
            // Necesitamos verificar que el vendedor del lote sea el usuario actual
            // El cuadre.tanda.lote.vendedorId debería coincidir con user.id
            // Como el DTO no incluye vendedorId directamente, usamos el query con filtro
            const misCuadres = await this.queryBus.execute(
                new ListarCuadresQuery({ vendedorId: user.id, take: 1000 }),
            );

            const esMiCuadre = misCuadres.data.some((c: CuadreResponseDto) => c.id === id);
            if (!esMiCuadre) {
                throw new DomainException(
                    'CUA_005',
                    'Cuadre no encontrado',
                    { cuadreId: id },
                );
            }
        }

        return cuadre;
    }

    /**
     * POST /cuadres/:id/confirmar
     * Confirma un cuadre como exitoso (admin)
     */
    @Post(':id/confirmar')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Confirmar cuadre exitoso (admin)' })
    @ApiParam({ name: 'id', description: 'ID del cuadre' })
    @ApiResponse({
        status: 200,
        description: 'Cuadre confirmado exitosamente',
        type: CuadreResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Cuadre no encontrado' })
    @ApiResponse({ status: 409, description: 'El cuadre no está en estado PENDIENTE o monto insuficiente' })
    async confirmar(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ConfirmarCuadreDto,
        @CurrentUser() admin: AuthenticatedUser,
    ): Promise<CuadreResponseDto> {
        if (!admin) throw new UnauthorizedException();

        await this.commandBus.execute(
            new ConfirmarCuadreCommand(id, dto.montoRecibido, admin.id),
        );
        return this.queryBus.execute(new ObtenerCuadreQuery(id));
    }
}