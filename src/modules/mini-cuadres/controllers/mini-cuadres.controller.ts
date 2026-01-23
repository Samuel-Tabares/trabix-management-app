import {
    Controller,
    Get,
    Post,
    Param,
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
import { MiniCuadreResponseDto } from '../application/dto';

// Commands
import { ConfirmarMiniCuadreCommand } from '../application/commands';

// Queries
import {
    ObtenerMiniCuadrePorLoteQuery,
    ObtenerMiniCuadreQuery,
} from '../application/queries';

/**
 * Controlador de Mini-Cuadres
 * Según sección 20.10 del documento
 * 
 * Endpoints:
 * - GET /lote/:loteId    - Obtener mini-cuadre de lote
 * - POST /:id/confirmar  - Confirmar mini-cuadre (admin)
 */
@ApiTags('Mini-Cuadres')
@ApiBearerAuth('access-token')
@Controller('mini-cuadres')
export class MiniCuadresController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * GET /mini-cuadres/lote/:loteId
   * Obtiene el mini-cuadre de un lote
   */
  @Get('lote/:loteId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Obtener mini-cuadre de lote' })
  @ApiParam({ name: 'loteId', description: 'ID del lote' })
  @ApiResponse({
    status: 200,
    description: 'Datos del mini-cuadre',
    type: MiniCuadreResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Mini-cuadre no encontrado' })
  async obtenerPorLote(
    @Param('loteId', ParseUUIDPipe) loteId: string,
  ): Promise<MiniCuadreResponseDto> {
    return this.queryBus.execute(new ObtenerMiniCuadrePorLoteQuery(loteId));
  }

  /**
   * POST /mini-cuadres/:id/confirmar
   * Confirma un mini-cuadre (admin)
   */
  @Post(':id/confirmar')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar mini-cuadre (admin)' })
  @ApiParam({ name: 'id', description: 'ID del mini-cuadre' })
  @ApiResponse({
    status: 200,
    description: 'Mini-cuadre confirmado',
    type: MiniCuadreResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Mini-cuadre no encontrado' })
  @ApiResponse({ status: 409, description: 'El mini-cuadre no está pendiente' })
  async confirmar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<MiniCuadreResponseDto> {
    if (!admin) throw new UnauthorizedException();

    await this.commandBus.execute(new ConfirmarMiniCuadreCommand(id, admin.id));
    return this.queryBus.execute(new ObtenerMiniCuadreQuery(id));
  }
}
