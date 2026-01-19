import { CommandHandler, ICommandHandler, ICommand, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import {
    IMiniCuadreRepository,
    MINI_CUADRE_REPOSITORY,
} from '../../domain/mini-cuadre.repository.interface';
import {
    ILoteRepository,
    LOTE_REPOSITORY,
} from '../../../lotes/domain/lote.repository.interface';
import {
    ITandaRepository,
    TANDA_REPOSITORY,
} from '../../../lotes/domain/tanda.repository.interface';
import { MiniCuadreEntity } from '../../domain/mini-cuadre.entity';
import { DomainException } from '../../../../domain/exceptions/domain.exception';
import { MiniCuadreExitosoEvent } from '../events/mini-cuadre-exitoso.event';
/**
 * Command para confirmar un mini-cuadre
 */
export class ConfirmarMiniCuadreCommand implements ICommand {
  constructor(
    public readonly miniCuadreId: string,
    public readonly adminId: string,
  ) {}
}

/**
 * Handler del comando ConfirmarMiniCuadre
 * Según sección 9 del documento
 * 
 * Acciones (MiniCuadreExitosoEvent):
 * 1. Marcar última tanda como FINALIZADA
 * 2. Marcar lote como FINALIZADO
 * 3. Enviar notificación al vendedor
 */
@CommandHandler(ConfirmarMiniCuadreCommand)
export class ConfirmarMiniCuadreHandler
  implements ICommandHandler<ConfirmarMiniCuadreCommand>
{
  private readonly logger = new Logger(ConfirmarMiniCuadreHandler.name);

  constructor(
    @Inject(MINI_CUADRE_REPOSITORY)
    private readonly miniCuadreRepository: IMiniCuadreRepository,
    @Inject(LOTE_REPOSITORY)
    private readonly loteRepository: ILoteRepository,
    @Inject(TANDA_REPOSITORY)
    private readonly tandaRepository: ITandaRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ConfirmarMiniCuadreCommand): Promise<any> {
    const { miniCuadreId} = command;

    // Buscar el mini-cuadre
    const miniCuadre = await this.miniCuadreRepository.findById(miniCuadreId);
    if (!miniCuadre) {
      throw new DomainException('MCU_003', 'Mini-cuadre no encontrado', {
        miniCuadreId,
      });
    }

    // Validar que se puede confirmar
    const miniCuadreEntity = new MiniCuadreEntity({
      id: miniCuadre.id,
      loteId: miniCuadre.loteId,
      tandaId: miniCuadre.tandaId,
      estado: miniCuadre.estado,
      montoFinal: miniCuadre.montoFinal,
      fechaPendiente: miniCuadre.fechaPendiente,
      fechaExitoso: miniCuadre.fechaExitoso,
    });
    miniCuadreEntity.validarConfirmacion();

    // 1. Marcar última tanda como FINALIZADA
    await this.tandaRepository.finalizar(miniCuadre.tandaId);
    this.logger.log(`Última tanda finalizada: ${miniCuadre.tandaId}`);

    // 2. Marcar lote como FINALIZADO
    await this.loteRepository.finalizar(miniCuadre.loteId);
    this.logger.log(`Lote finalizado: ${miniCuadre.loteId}`);

    // 3. Confirmar mini-cuadre como EXITOSO
    const miniCuadreConfirmado = await this.miniCuadreRepository.confirmarExitoso(
      miniCuadreId,
    );

    this.logger.log(
      `Mini-cuadre confirmado: ${miniCuadreId} - ` +
      `Monto final: $${Number.parseFloat(miniCuadre.montoFinal as any).toFixed(2)}`,
    );

    // Publicar evento
    this.eventBus.publish(
      new MiniCuadreExitosoEvent(
        miniCuadreId,
        miniCuadre.loteId,
        miniCuadre.tandaId,
        miniCuadre.lote?.vendedorId || '',
        miniCuadre.montoFinal,
      ),
    );

    return miniCuadreConfirmado;
  }
}
