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
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../auth/decorators/current-user.decorator';

// DTOs
import {
    ConfirmarCuadreDto,
    QueryCuadresDto,
    CuadreResponseDto,
    CuadresPaginadosDto,
} from '../application/dto';

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
 */
@ApiTags('Cuadres')
@ApiBearerAuth('access-token')
@Controller('cuadres')
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
  ): Promise<CuadreResponseDto> {
    return this.queryBus.execute(new ObtenerCuadreQuery(id));
  }

  /**
   * POST /cuadres/:id/confirmar
   * Confirma un cuadre como exitoso (admin)
   */
  @Post(':id/confirmar')
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
    await this.commandBus.execute(
      new ConfirmarCuadreCommand(id, dto.montoRecibido, admin.id),
    );
    return this.queryBus.execute(new ObtenerCuadreQuery(id));
  }
}
