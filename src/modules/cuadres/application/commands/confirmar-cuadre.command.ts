import { CommandHandler, ICommandHandler, ICommand, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import {
  ICuadreRepository,
  CUADRE_REPOSITORY,
    CuadreEntity,
    CuadreExitosoEvent,
} from '@modules/cuadres';
import { DomainException } from '@/domain';

/**
 * Command para confirmar un cuadre como exitoso
 */
export class ConfirmarCuadreCommand implements ICommand {
  constructor(
    public readonly cuadreId: string,
    public readonly montoRecibido: number,
    public readonly adminId: string,
  ) {}
}

/**
 * Handler del comando ConfirmarCuadre
 * Según sección 17.6 del documento
 * 
 * Validaciones:
 * - Cuadre existe y está PENDIENTE
 * - monto_recibido >= monto_esperado
 * - Admin confirma
 * 
 * Al confirmar exitoso:
 * - Actualiza estado a EXITOSO
 * - Publica CuadreExitosoEvent (libera siguiente tanda)
 */
@CommandHandler(ConfirmarCuadreCommand)
export class ConfirmarCuadreHandler
  implements ICommandHandler<ConfirmarCuadreCommand>
{
  private readonly logger = new Logger(ConfirmarCuadreHandler.name);

  constructor(
    @Inject(CUADRE_REPOSITORY)
    private readonly cuadreRepository: ICuadreRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ConfirmarCuadreCommand): Promise<any> {
    const { cuadreId, montoRecibido, adminId } = command;

    // Buscar el cuadre
    const cuadre = await this.cuadreRepository.findById(cuadreId);
    if (!cuadre) {
      throw new DomainException(
        'CUA_001',
        'Cuadre no encontrado',
        { cuadreId },
      );
    }

    // Crear entidad de dominio para validaciones
    const cuadreEntity = new CuadreEntity({
      ...cuadre,
      montoEsperado: cuadre.montoEsperado,
      montoRecibido: cuadre.montoRecibido,
      montoFaltante: cuadre.montoFaltante,
      montoCubiertoPorMayor: cuadre.montoCubiertoPorMayor,
    });

    // Validar que se puede confirmar
    const montoRecibidoDecimal = new Decimal(montoRecibido);
    cuadreEntity.validarConfirmacion(montoRecibidoDecimal);

    // Confirmar como exitoso
    const cuadreActualizado = await this.cuadreRepository.confirmarExitoso(
      cuadreId,
      montoRecibidoDecimal,
    );

    this.logger.log(
      `Cuadre confirmado exitoso: ${cuadreId} - Monto: $${montoRecibido} - Admin: ${adminId}`,
    );

    // Publicar evento CuadreExitosoEvent
    this.eventBus.publish(
      new CuadreExitosoEvent(
        cuadreId,
        cuadre.tandaId,
        cuadre.tanda.loteId,
        cuadre.tanda.lote?.vendedorId || '',
        montoRecibidoDecimal,
        cuadre.tanda.numero,
      ),
    );

    return cuadreActualizado;
  }
}
