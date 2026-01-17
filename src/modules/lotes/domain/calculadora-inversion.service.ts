import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { ModeloNegocio } from '@prisma/client';

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
  private readonly PORCENTAJE_INVERSION = new Decimal(0.5);

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
    return inversionTotal.times(this.PORCENTAJE_INVERSION);
  }

  /**
   * Calcula la inversión del vendedor (50%)
   */
  calcularInversionVendedor(inversionTotal: Decimal): Decimal {
    return inversionTotal.times(this.PORCENTAJE_INVERSION);
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
   * Calcula las ganancias según el modelo de negocio
   * Según secciones 16.5 y 2.4 del documento
   */
  calcularGanancias(
    gananciaTotal: Decimal,
    modeloNegocio: ModeloNegocio,
    cadenaReclutadores: CadenaReclutador[] = [],
  ): DistribucionGanancias {
    if (gananciaTotal.lessThanOrEqualTo(0)) {
      return {
        gananciaVendedor: new Decimal(0),
        gananciaAdmin: new Decimal(0),
        gananciasReclutadores: [],
      };
    }

    if (modeloNegocio === 'MODELO_60_40') {
      // MODELO 60/40: 60% vendedor, 40% admin
      return {
        gananciaVendedor: gananciaTotal.times(0.6),
        gananciaAdmin: gananciaTotal.times(0.4),
        gananciasReclutadores: [],
      };
    }

    // MODELO 50/50 con cascada
    // ganancia_vendedor_N = ganancia_total × 0.5
    // ganancia_reclutador_N-1 = ganancia_vendedor_N × 0.5
    // ganancia_reclutador_N-2 = ganancia_reclutador_N-1 × 0.5
    // ... (continúa hasta admin)
    // ganancia_admin = ganancia_ultimo_reclutador

    const gananciaVendedor = gananciaTotal.times(0.5);
    const gananciasReclutadores: GananciaReclutador[] = [];
    
    let gananciaAnterior = gananciaVendedor;
    
    for (const reclutador of cadenaReclutadores) {
      const gananciaReclutador = gananciaAnterior.times(0.5);
      gananciasReclutadores.push({
        reclutadorId: reclutador.id,
        nivel: reclutador.nivel,
        monto: gananciaReclutador,
      });
      gananciaAnterior = gananciaReclutador;
    }

    // Admin recibe lo mismo que el último reclutador
    const gananciaAdmin = gananciaAnterior.times(0.5);

    return {
      gananciaVendedor,
      gananciaAdmin,
      gananciasReclutadores,
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

  /**
   * Calcula la ganancia no obtenida por regalos
   * Según sección 16.11: ganancia_no_obtenida = cantidad_regalos × $8,000
   */
  calcularGananciaNoObtenida(cantidadRegalos: number): Decimal {
    const PRECIO_UNIDAD = new Decimal(8000);
    return PRECIO_UNIDAD.times(cantidadRegalos);
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
 * Información de reclutador en la cadena
 */
export interface CadenaReclutador {
  id: string;
  nivel: number;
}

/**
 * Ganancia de un reclutador específico
 */
export interface GananciaReclutador {
  reclutadorId: string;
  nivel: number;
  monto: Decimal;
}

/**
 * Distribución completa de ganancias
 */
export interface DistribucionGanancias {
  gananciaVendedor: Decimal;
  gananciaAdmin: Decimal;
  gananciasReclutadores: GananciaReclutador[];
}
