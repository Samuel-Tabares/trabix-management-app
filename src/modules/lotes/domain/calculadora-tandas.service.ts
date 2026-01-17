import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';

/**
 * Servicio de dominio para cálculos de tandas
 * Según sección 16.1 del documento
 * 
 * División de tandas:
 * - SI cantidad_trabix <= 50: 2 tandas (50% / 50%)
 * - SI cantidad_trabix > 50: 3 tandas (~33.3%)
 * 
 * Regla de redondeo: >= 0.5 redondea hacia arriba, < 0.5 redondea hacia abajo.
 * La diferencia por redondeo se asigna a las primeras tandas.
 */
@Injectable()
export class CalculadoraTandasService {
  /**
   * Calcula la distribución de TRABIX en tandas
   */
  calcularDistribucionTandas(cantidadTrabix: number): DistribucionTandas[] {
    if (cantidadTrabix <= 50) {
      return this.calcularDosTandas(cantidadTrabix);
    }
    return this.calcularTresTandas(cantidadTrabix);
  }

  /**
   * Calcula distribución para 2 tandas (≤50 TRABIX)
   * tanda_1 = REDONDEAR(cantidad_trabix × 0.5)
   * tanda_2 = cantidad_trabix - tanda_1
   */
  private calcularDosTandas(cantidadTrabix: number): DistribucionTandas[] {
    const tanda1 = Math.round(cantidadTrabix * 0.5);
    const tanda2 = cantidadTrabix - tanda1;

    return [
      { numero: 1, stockInicial: tanda1 },
      { numero: 2, stockInicial: tanda2 },
    ];
  }

  /**
   * Calcula distribución para 3 tandas (>50 TRABIX)
   * tanda_1 = REDONDEAR(cantidad_trabix × 0.333)
   * tanda_2 = REDONDEAR(cantidad_trabix × 0.333)
   * tanda_3 = cantidad_trabix - tanda_1 - tanda_2
   */
  private calcularTresTandas(cantidadTrabix: number): DistribucionTandas[] {
    const tanda1 = Math.round(cantidadTrabix * 0.333);
    const tanda2 = Math.round(cantidadTrabix * 0.333);
    const tanda3 = cantidadTrabix - tanda1 - tanda2;

    return [
      { numero: 1, stockInicial: tanda1 },
      { numero: 2, stockInicial: tanda2 },
      { numero: 3, stockInicial: tanda3 },
    ];
  }

  /**
   * Calcula el número de tandas según la cantidad
   */
  calcularNumeroTandas(cantidadTrabix: number): number {
    return cantidadTrabix <= 50 ? 2 : 3;
  }

  /**
   * Verifica si se debe disparar un cuadre basado en el stock restante
   * Según sección 16.6 del documento
   * 
   * LOTE 3 TANDAS:
   * - Cuadre T1: dinero_recaudado >= inversion_admin
   * - Cuadre T2: stock_actual_T2 <= stock_inicial_T2 × 0.10
   * - Cuadre T3: stock_actual_T3 <= stock_inicial_T3 × 0.20
   * 
   * LOTE 2 TANDAS:
   * - Cuadre T1: stock_actual_T1 <= stock_inicial_T1 × 0.10
   * - Cuadre T2: stock_actual_T2 <= stock_inicial_T2 × 0.20
   */

  verificarTriggerCuadre(
    numeroTanda: number,
    totalTandas: number,
    stockActual: number,
    stockInicial: number,
    dineroRecaudado: Decimal,
    inversionAdmin: Decimal,
  ): TriggerCuadreResult {
    // Lote de 3 tandas
    if (totalTandas === 3) {
      switch (numeroTanda) {
        case 1:
          // Cuadre T1: dinero_recaudado >= inversion_admin
        {
            const disparaPorDinero = dineroRecaudado.greaterThanOrEqualTo(inversionAdmin);
            return {
                debeDisparar: disparaPorDinero,
                razon: disparaPorDinero ? 'INVERSION_RECUPERADA' : null,
                porcentajeStock: (stockActual / stockInicial) * 100,
            };
        }
        case 2:
          // Cuadre T2: stock_actual <= stock_inicial × 0.10
        {
            const dispara10 = stockActual <= stockInicial * 0.1;
            return {
                debeDisparar: dispara10,
                razon: dispara10 ? 'STOCK_10_PORCIENTO' : null,
                porcentajeStock: (stockActual / stockInicial) * 100,
            };
        }
        case 3:
          // Cuadre T3: stock_actual <= stock_inicial × 0.20
        {
            const dispara20T3 = stockActual <= stockInicial * 0.2;
            return {
                debeDisparar: dispara20T3,
                razon: dispara20T3 ? 'STOCK_20_PORCIENTO' : null,
                porcentajeStock: (stockActual / stockInicial) * 100,
            };
        }
      }
    }

    // Lote de 2 tandas
    if (totalTandas === 2) {
      switch (numeroTanda) {
        case 1:
          // Cuadre T1: stock_actual <= stock_inicial × 0.10
        {
            const dispara10T1 = stockActual <= stockInicial * 0.1;
            return {
                debeDisparar: dispara10T1,
                razon: dispara10T1 ? 'STOCK_10_PORCIENTO' : null,
                porcentajeStock: (stockActual / stockInicial) * 100,
            };
        }
        case 2:
          // Cuadre T2: stock_actual <= stock_inicial × 0.20
        {
            const dispara20T2 = stockActual <= stockInicial * 0.2;
            return {
                debeDisparar: dispara20T2,
                razon: dispara20T2 ? 'STOCK_20_PORCIENTO' : null,
                porcentajeStock: (stockActual / stockInicial) * 100,
            };
        }
      }
    }

    return {
      debeDisparar: false,
      razon: null,
      porcentajeStock: (stockActual / stockInicial) * 100,
    };
  }

  /**
   * Verifica si se debe disparar el mini-cuadre
   * Según sección 16.6: stock_actual de última tanda = 0
   */
  verificarTriggerMiniCuadre(
    numeroTanda: number,
    totalTandas: number,
    stockActual: number,
  ): boolean {
    // Solo la última tanda dispara mini-cuadre
    if (numeroTanda !== totalTandas) {
      return false;
    }
    return stockActual === 0;
  }

  /**
   * Calcula el monto esperado para un cuadre
   * Según sección 16.7 del documento
   */
  calcularMontoEsperadoCuadre(
    numeroTanda: number,
    totalTandas: number,
    inversionAdmin: Decimal,
    gananciaAdminHastaMomento: Decimal,
    gananciaAdminRestante: Decimal,
  ): Decimal {
    if (totalTandas === 3) {
      switch (numeroTanda) {
        case 1:
          return inversionAdmin;
        case 2:
          return gananciaAdminHastaMomento;
        case 3:
          return gananciaAdminRestante;
      }
    }

    if (totalTandas === 2) {
      switch (numeroTanda) {
        case 1:
          return inversionAdmin.plus(gananciaAdminHastaMomento);
        case 2:
          return gananciaAdminRestante;
      }
    }

    return new Decimal(0);
  }
}

/**
 * Distribución de una tanda
 */
export interface DistribucionTandas {
  numero: number;
  stockInicial: number;
}

/**
 * Resultado de verificar trigger de cuadre
 */
export interface TriggerCuadreResult {
  debeDisparar: boolean;
  razon: 'INVERSION_RECUPERADA' | 'STOCK_10_PORCIENTO' | 'STOCK_20_PORCIENTO' | null;
  porcentajeStock: number;
}
