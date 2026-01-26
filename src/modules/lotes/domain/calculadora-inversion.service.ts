import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';

/**
 * Servicio de dominio para cálculos de inversión
 * Según sección 16.2 del documento
 * 
 * Fórmulas:
 * - inversion_total = cantidad_trabix × costo_percibido
 * - inversion_admin = inversion_total × 0.5
 * - inversion_vendedor = inversion_total × 0.5
 * 
 * costo_percibido = $2,400 por TRABIX
 */
@Injectable()
export class CalculadoraInversionService {
  // Costo percibido por TRABIX (según documento)
  private readonly COSTO_PERCIBIDO = new Decimal(2400);
  
  // Porcentaje de inversión (50% cada uno)
  private readonly PORCENTAJE_INVERSION_VENDEDOR = new Decimal(0.5);

  /**
   * Calcula la inversión total de un lote
   */
  calcularInversionTotal(cantidadTrabix: number): Decimal {
    return this.COSTO_PERCIBIDO.times(cantidadTrabix);
  }

  /**
   * Calcula la inversión del admin (50%)
   */
  calcularInversionAdmin(inversionTotal: Decimal): Decimal {
    return inversionTotal.times(this.PORCENTAJE_INVERSION_VENDEDOR);
  }

  /**
   * Calcula la inversión del vendedor (50%)
   */
  calcularInversionVendedor(inversionTotal: Decimal): Decimal {
    return inversionTotal.times(this.PORCENTAJE_INVERSION_VENDEDOR);
  }

  /**
   * Calcula todas las inversiones de un lote
   */
  calcularInversiones(cantidadTrabix: number): InversionesLote {
    const inversionTotal = this.calcularInversionTotal(cantidadTrabix);
    const inversionAdmin = this.calcularInversionAdmin(inversionTotal);
    const inversionVendedor = this.calcularInversionVendedor(inversionTotal);

    return {
      inversionTotal,
      inversionAdmin,
      inversionVendedor,
    };
  }
    /**
     * Calcula el aporte al fondo de recompensas
   * Según sección 16.9: aporte_por_trabix = $200
   */
  calcularAporteFondo(cantidadTrabix: number): Decimal {
    const APORTE_POR_TRABIX = new Decimal(200);
    return APORTE_POR_TRABIX.times(cantidadTrabix);
  }

  /**
   * Calcula el máximo de regalos permitidos
   * Según sección 16.11: maximo_regalos = REDONDEAR_ABAJO(cantidad_lote × 0.08)
   */
  calcularMaximoRegalos(cantidadTrabix: number): number {
    return Math.floor(cantidadTrabix * 0.08);
  }
}

/**
 * Resultado del cálculo de inversiones
 */
export interface InversionesLote {
  inversionTotal: Decimal;
  inversionAdmin: Decimal;
  inversionVendedor: Decimal;
}
/**
 * TODO:Ganancia de un reclutador específico
 */
export interface GananciaReclutador {
  reclutadorId: string;
  nivel: number;
  monto: Decimal;
}
