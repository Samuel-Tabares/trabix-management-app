import { Injectable } from '@nestjs/common';
import { ModeloNegocio } from '@prisma/client';
import { Decimal } from 'decimal.js';

/**
 * Interface para estrategias de cálculo de ganancias
 */
export interface IGananciaStrategy {
  calcular(gananciaTotal: Decimal, jerarquia?: JerarquiaReclutador[]): ResultadoGanancias;
}

/**
 * Representa un reclutador en la jerarquía
 */
export interface JerarquiaReclutador {
  id: string;
  nivel: number; // N-1, N-2, etc. donde N es el vendedor
  nombre?: string;
}

/**
 * Resultado del cálculo de ganancias
 */
export interface ResultadoGanancias {
  gananciaVendedor: Decimal;
  gananciaAdmin: Decimal;
  gananciasReclutadores: GananciaReclutador[];
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
 * Strategy: Modelo 60/40
 * Según sección 16.5 del documento
 * 
 * ganancia_vendedor = ganancia_total × 0.6
 * ganancia_admin = ganancia_total × 0.4
 */
@Injectable()
export class Modelo6040Strategy implements IGananciaStrategy {
  calcular(gananciaTotal: Decimal): ResultadoGanancias {
    const gananciaVendedor = gananciaTotal.times(0.6);
    const gananciaAdmin = gananciaTotal.times(0.4);

    return {
      gananciaVendedor,
      gananciaAdmin,
      gananciasReclutadores: [],
    };
  }
}

/**
 * Strategy: Modelo 50/50 con Cascada
 * Según sección 16.5 del documento
 * 
 * ganancia_vendedor_N = ganancia_total × 0.5
 * ganancia_reclutador_N-1 = ganancia_vendedor_N × 0.5
 * ganancia_reclutador_N-2 = ganancia_reclutador_N-1 × 0.5
 * ... (continúa hasta admin)
 * ganancia_admin = ganancia_ultimo_reclutador
 * 
 * Ejemplo 4 niveles con ganancia_total = $100,000:
 * - Vendedor (N): $100,000 × 0.5 = $50,000
 * - Reclutador (N-1): $50,000 × 0.5 = $25,000
 * - Reclutador (N-2): $25,000 × 0.5 = $12,500
 * - Admin: $12,500
 */
@Injectable()
export class Modelo5050CascadaStrategy implements IGananciaStrategy {
  calcular(gananciaTotal: Decimal, jerarquia: JerarquiaReclutador[] = []): ResultadoGanancias {
    // Ganancia del vendedor: 50% del total
    const gananciaVendedor = gananciaTotal.times(0.5);
    
    const gananciasReclutadores: GananciaReclutador[] = [];
    let gananciaActual = gananciaVendedor;

    // Ordenar jerarquía por nivel (N-1, N-2, etc.)
    const jerarquiaOrdenada = [...jerarquia].sort((a, b) => a.nivel - b.nivel);

    // Calcular ganancia para cada reclutador en la cascada
    for (const reclutador of jerarquiaOrdenada) {
      const gananciaReclutador = gananciaActual.times(0.5);
      gananciasReclutadores.push({
        reclutadorId: reclutador.id,
        nivel: reclutador.nivel,
        monto: gananciaReclutador,
      });
      gananciaActual = gananciaReclutador;
    }

    // Según documento: ganancia_admin = ganancia_ultimo_reclutador
    // Si no hay reclutadores, 50/50 directo con vendedor
    const gananciaAdmin = jerarquiaOrdenada.length > 0
      ? gananciaActual  // Admin recibe igual que el último reclutador
      : gananciaTotal.times(0.5);

    return {
      gananciaVendedor,
      gananciaAdmin,
      gananciasReclutadores,
    };
  }
}

/**
 * Domain Service: Calculadora de Ganancias
 * Según sección 16.5 del documento
 * 
 * Utiliza el patrón Strategy para calcular ganancias según el modelo de negocio:
 * - MODELO_60_40: 60% vendedor, 40% admin
 * - MODELO_50_50: 50% vendedor, 50% se divide en cascada entre reclutadores
 */
@Injectable()
export class CalculadoraGananciasService {
  private readonly strategies: Map<ModeloNegocio, IGananciaStrategy>;

  constructor(
    private readonly modelo6040: Modelo6040Strategy,
    private readonly modelo5050: Modelo5050CascadaStrategy,
  ) {
    this.strategies = new Map([
      ['MODELO_60_40', this.modelo6040],
      ['MODELO_50_50', this.modelo5050],
    ]);
  }

  /**
   * Calcula las ganancias según el modelo de negocio
   * 
   * @param dineroRecaudado Dinero total recaudado
   * @param inversionTotal Inversión total del lote
   * @param modelo Modelo de negocio (60/40 o 50/50)
   * @param jerarquia Jerarquía de reclutadores (solo para 50/50)
   */
  calcularGanancias(
    dineroRecaudado: Decimal,
    inversionTotal: Decimal,
    modelo: ModeloNegocio,
    jerarquia?: JerarquiaReclutador[],
  ): ResultadoCalculoGanancias {
    // ganancia_total = dinero_recaudado - inversion_total
    // Condición: ganancia_total solo existe cuando dinero_recaudado > inversion_total
    const gananciaTotal = dineroRecaudado.minus(inversionTotal);

    if (gananciaTotal.lessThanOrEqualTo(0)) {
      return {
        hayGanancias: false,
        gananciaTotal: new Decimal(0),
        gananciaVendedor: new Decimal(0),
        gananciaAdmin: new Decimal(0),
        gananciasReclutadores: [],
      };
    }

    const strategy = this.strategies.get(modelo);
    if (!strategy) {
      throw new Error(`Modelo de negocio no soportado: ${modelo}`);
    }

    const resultado = strategy.calcular(gananciaTotal, jerarquia);

    return {
      hayGanancias: true,
      gananciaTotal,
      ...resultado,
    };
  }

  /**
   * Calcula la ganancia del admin hasta el momento
   * Útil para calcular monto esperado en cuadres
   */
  calcularGananciaAdminHastaMomento(
    dineroRecaudado: Decimal,
    inversionTotal: Decimal,
    modelo: ModeloNegocio,
    jerarquia?: JerarquiaReclutador[],
  ): Decimal {
    const resultado = this.calcularGanancias(
      dineroRecaudado,
      inversionTotal,
      modelo,
      jerarquia,
    );
    return resultado.gananciaAdmin;
  }

  /**
   * Calcula el monto esperado para un cuadre según el concepto
   */
  calcularMontoEsperadoCuadre(
    concepto: 'INVERSION_ADMIN' | 'GANANCIAS' | 'MIXTO',
    inversionAdmin: Decimal,
    gananciaAdmin: Decimal,
  ): Decimal {
    switch (concepto) {
      case 'INVERSION_ADMIN':
        return inversionAdmin;
      case 'GANANCIAS':
        return gananciaAdmin;
      case 'MIXTO':
        return inversionAdmin.plus(gananciaAdmin);
      default:
        return new Decimal(0);
    }
  }
}

/**
 * Resultado completo del cálculo de ganancias
 */
export interface ResultadoCalculoGanancias {
  hayGanancias: boolean;
  gananciaTotal: Decimal;
  gananciaVendedor: Decimal;
  gananciaAdmin: Decimal;
  gananciasReclutadores: GananciaReclutador[];
}
