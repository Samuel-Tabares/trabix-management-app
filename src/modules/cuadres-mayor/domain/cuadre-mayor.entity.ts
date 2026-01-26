import { Decimal } from 'decimal.js';

/**
 * Ganancia de reclutador en el cuadre al mayor
 */
export interface GananciaReclutadorMayor {
  reclutadorId: string;
  nivel: number;
  monto: Decimal;
}

/**
 * Tanda afectada por el cuadre al mayor
 */
export interface TandaAfectada {
  tandaId: string;
  cantidadStockConsumido: number;
}

/**
 * Evaluación financiera del cuadre al mayor
 * Según sección 8.3 del documento
 */
export interface EvaluacionFinanciera {
  dineroRecaudadoDetal: Decimal;
  dineroVentaMayor: Decimal;
  dineroTotalDisponible: Decimal;
  inversionAdminTotal: Decimal;
  inversionVendedorTotal: Decimal;
  inversionAdminCubierta: Decimal;
  inversionVendedorCubierta: Decimal;
  gananciaNeta: Decimal;
  gananciaAdmin: Decimal;
  gananciaVendedor: Decimal;
  deudasSaldadas: Decimal;
  gananciasReclutadores: GananciaReclutadorMayor[];
}
