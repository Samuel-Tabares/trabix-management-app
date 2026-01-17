import { CommandHandler, ICommandHandler, ICommand, CommandBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import {
  ICuadreRepository,
  CUADRE_REPOSITORY,
    CuadreEntity,
} from '@modules/cuadres';
import { DomainException } from '@/domain';
import { EnviarNotificacionCommand } from '@modules/notificaciones/application';

/**
 * Command para activar un cuadre (INACTIVO → PENDIENTE)
 * Se ejecuta cuando se cumple el trigger
 */
export class ActivarCuadreCommand implements ICommand {
  constructor(public readonly cuadreId: string) {}
}

/**
 * Handler del comando ActivarCuadre
 * Según sección 17.6 del documento
 * 
 * Validaciones:
 * - Cuadre existe y está INACTIVO
 * - Trigger cumplido (verificado antes de llamar al comando)
 */
@CommandHandler(ActivarCuadreCommand)
export class ActivarCuadreHandler
  implements ICommandHandler<ActivarCuadreCommand>
{
  private readonly logger = new Logger(ActivarCuadreHandler.name);

  constructor(
    @Inject(CUADRE_REPOSITORY)
    private readonly cuadreRepository: ICuadreRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: ActivarCuadreCommand): Promise<any> {
    const { cuadreId } = command;

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

    // Validar que se puede activar
    cuadreEntity.validarActivacion();

    // Activar el cuadre
    const cuadreActivado = await this.cuadreRepository.activar(cuadreId);

    this.logger.log(
      `Cuadre activado: ${cuadreId} - Tanda ${cuadre.tanda.numero} - Lote ${cuadre.tanda.loteId}`,
    );

    // Enviar notificación de cuadre pendiente
      await this.commandBus.execute(
          new EnviarNotificacionCommand(
              cuadre.tanda.lote!.vendedorId,
              'CUADRE_PENDIENTE',
              {
                  cuadreId: cuadreId,
                  tandaId: cuadre.tandaId,
                  numeroTanda: cuadre.tanda.numero,
                  montoEsperado: Number.parseFloat(cuadre.montoEsperado.toString()),
              },
          ),
      );
      return cuadreActivado;
  }
}
