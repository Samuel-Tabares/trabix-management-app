import { Injectable, Inject } from '@nestjs/common';
import { DomainException } from '../../../domain/exceptions/domain.exception';
import {
    IVentaRepository,
    VENTA_REPOSITORY,
} from './venta.repository.interface';

/**
 * Specification: RegaloPermitido
 * Según sección 6.3 y 17 del documento
 * 
 * Validación:
 * Si incluye REGALO: total_regalos_lote + cantidad_regalo <= cantidad_lote × 0.08
 * 
 * Máximo permitido: 8% del total del lote
 */
@Injectable()
export class RegaloPermitidoSpecification {
  constructor(
    @Inject(VENTA_REPOSITORY)
    private readonly ventaRepository: IVentaRepository,
  ) {}

  /**
   * Verifica si se pueden agregar regalos a un lote
   * @param loteId ID del lote
   * @param cantidadLote Cantidad total de TRABIX del lote
   * @param cantidadRegalosNuevos Cantidad de regalos que se quieren agregar
   */
  async verificar(
    loteId: string,
    cantidadLote: number,
    cantidadRegalosNuevos: number,
  ): Promise<RegaloPermitidoResult> {
    // Si no hay regalos nuevos, no hay nada que validar
    if (cantidadRegalosNuevos <= 0) {
      return {
        permitido: true,
        maximoRegalos: this.calcularMaximoRegalos(cantidadLote),
        regalosActuales: 0,
        regalosDisponibles: this.calcularMaximoRegalos(cantidadLote),
      };
    }

    // Calcular máximo de regalos permitidos (8% del lote)
    const maximoRegalos = this.calcularMaximoRegalos(cantidadLote);

    // Obtener regalos ya utilizados en el lote
    const regalosActuales = await this.ventaRepository.contarRegalosPorLote(loteId);

    // Verificar si hay espacio para los nuevos regalos
    const regalosDisponibles = maximoRegalos - regalosActuales;
    const permitido = cantidadRegalosNuevos <= regalosDisponibles;

    if (!permitido) {
      throw new DomainException(
        'VNT_001',
        'Se excede el máximo de regalos permitidos para este lote',
        {
          maximoRegalos,
          regalosActuales,
          regalosDisponibles,
          cantidadSolicitada: cantidadRegalosNuevos,
        },
      );
    }

    return {
      permitido,
      maximoRegalos,
      regalosActuales,
      regalosDisponibles,
    };
  }

  /**
   * Calcula el máximo de regalos permitidos
   * maximo_regalos = REDONDEAR_ABAJO(cantidad_lote × 0.08)
   */
  private calcularMaximoRegalos(cantidadLote: number): number {
    return Math.floor(cantidadLote * 0.08);
  }
}

/**
 * Resultado de la verificación de regalo
 */
export interface RegaloPermitidoResult {
  permitido: boolean;
  maximoRegalos: number;
  regalosActuales: number;
  regalosDisponibles: number;
}
