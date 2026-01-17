import {
  Controller,
  Get,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
    Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import {
  ITandaRepository,
  TANDA_REPOSITORY,
    TandaResponseDto,
    TandaEntity,
    Roles,
} from '@/modules';
import { DomainException } from '@/domain';

/**
 * Controlador de Tandas
 * Según sección 20.5 del documento
 * 
 * Endpoints:
 * - GET /lote/:loteId    - Listar tandas de lote
 * - GET /:id             - Obtener tanda
 * - POST /:id/confirmar-entrega - Confirmar EN_CASA (admin)
 */
@ApiTags('Tandas')
@ApiBearerAuth('access-token')
@Controller('tandas')
export class TandasController {
  constructor(
    @Inject(TANDA_REPOSITORY)
    private readonly tandaRepository: ITandaRepository,
  ) {}

  /**
   * GET /tandas/lote/:loteId
   * Lista las tandas de un lote
   */
  @Get('lote/:loteId')
  @ApiOperation({ summary: 'Listar tandas de lote' })
  @ApiParam({ name: 'loteId', description: 'ID del lote' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tandas del lote',
    type: [TandaResponseDto],
  })
  async listarPorLote(
    @Param('loteId', ParseUUIDPipe) loteId: string,
  ): Promise<TandaResponseDto[]> {
    const tandas = await this.tandaRepository.findByLote(loteId);
    return tandas.map((tanda) => this.mapToDto(tanda));
  }

  /**
   * GET /tandas/:id
   * Obtiene una tanda por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener tanda' })
  @ApiParam({ name: 'id', description: 'ID de la tanda' })
  @ApiResponse({
    status: 200,
    description: 'Datos de la tanda',
    type: TandaResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tanda no encontrada' })
  async obtener(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TandaResponseDto> {
    const tanda = await this.tandaRepository.findById(id);
    if (!tanda) {
      throw new DomainException(
        'TND_001',
        'Tanda no encontrada',
        { tandaId: id },
      );
    }
    return this.mapToDto(tanda);
  }

  /**
   * POST /tandas/:id/confirmar-entrega
   * Confirma la entrega de una tanda (EN_TRÁNSITO → EN_CASA)
   */
  @Post(':id/confirmar-entrega')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar entrega EN_CASA (admin)' })
  @ApiParam({ name: 'id', description: 'ID de la tanda' })
  @ApiResponse({
    status: 200,
    description: 'Entrega confirmada',
    type: TandaResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tanda no encontrada' })
  @ApiResponse({ status: 409, description: 'Estado no permite esta acción' })
  async confirmarEntrega(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TandaResponseDto> {
    const tanda = await this.tandaRepository.findById(id);
    if (!tanda) {
      throw new DomainException(
        'TND_001',
        'Tanda no encontrada',
        { tandaId: id },
      );
    }

    // Validar transición usando la entidad de dominio
    const tandaEntity = new TandaEntity(tanda);
    tandaEntity.validarConfirmacionEntrega();

    // Confirmar entrega
    const tandaActualizada = await this.tandaRepository.confirmarEntrega(id);

    return this.mapToDto(tandaActualizada);
  }

  /**
   * Mapea una tanda de Prisma a TandaResponseDto
   */
  private mapToDto(tanda: any): TandaResponseDto {
    return {
      id: tanda.id,
      loteId: tanda.loteId,
      numero: tanda.numero,
      estado: tanda.estado,
      stockInicial: tanda.stockInicial,
      stockActual: tanda.stockActual,
      stockConsumidoPorMayor: tanda.stockConsumidoPorMayor,
      porcentajeStockRestante: tanda.stockInicial > 0
        ? (tanda.stockActual / tanda.stockInicial) * 100
        : 0,
      fechaLiberacion: tanda.fechaLiberacion,
      fechaEnTransito: tanda.fechaEnTransito,
      fechaEnCasa: tanda.fechaEnCasa,
      fechaFinalizada: tanda.fechaFinalizada,
    };
  }
}
