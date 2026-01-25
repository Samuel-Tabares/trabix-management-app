import { EstadoLote, ModeloNegocio } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { DomainException } from '@domain/exceptions/domain.exception';

/**
 * Entidad de dominio Lote
 * Según secciones 3.1-3.4 del documento
 * 
 * Un LOTE es una compra de x cantidad de TRABIX que:
 * - Tiene un costo
 * - Se divide en tandas (2 si ≤50, 3 si >50)
 * - Produce ventas y recaudo
 * 
 * Estados: CREADO → ACTIVO → FINALIZADO
 */
export class LoteEntity {
  readonly id: string;
  readonly vendedorId: string;
  readonly version: number;
  readonly cantidadTrabix: number;
  readonly modeloNegocio: ModeloNegocio;
  readonly estado: EstadoLote;
  readonly inversionTotal: Decimal;
  readonly inversionAdmin: Decimal;
  readonly inversionVendedor: Decimal;
  readonly dineroRecaudado: Decimal;
  readonly dineroTransferido: Decimal;
  readonly esLoteForzado: boolean;
  readonly ventaMayorOrigenId: string | null;
  readonly fechaCreacion: Date;
  readonly fechaActivacion: Date | null;
  readonly fechaFinalizacion: Date | null;

  constructor(props: LoteEntityProps) {
    this.id = props.id;
    this.vendedorId = props.vendedorId;
    this.version = props.version;
    this.cantidadTrabix = props.cantidadTrabix;
    this.modeloNegocio = props.modeloNegocio;
    this.estado = props.estado;
    this.inversionTotal = new Decimal(props.inversionTotal);
    this.inversionAdmin = new Decimal(props.inversionAdmin);
    this.inversionVendedor = new Decimal(props.inversionVendedor);
    this.dineroRecaudado = new Decimal(props.dineroRecaudado);
    this.dineroTransferido = new Decimal(props.dineroTransferido);
    this.esLoteForzado = props.esLoteForzado;
    this.ventaMayorOrigenId = props.ventaMayorOrigenId;
    this.fechaCreacion = props.fechaCreacion;
    this.fechaActivacion = props.fechaActivacion;
    this.fechaFinalizacion = props.fechaFinalizacion;
  }

  /**
   * Número de tandas según cantidad de TRABIX
   * Según sección 3.3: ≤50 → 2 tandas, >50 → 3 tandas
   */
  get numeroTandas(): number {
    return this.cantidadTrabix <= 50 ? 2 : 3;
  }

  /**
   * Ganancia total actual (si es positiva)
   * ganancia_total = dinero_recaudado - inversion_total
   */
  get gananciaTotal(): Decimal {
    const ganancia = this.dineroRecaudado.minus(this.inversionTotal);
    return ganancia.greaterThan(0) ? ganancia : new Decimal(0);
  }

  /**
   * Indica si ya se recuperó la inversión
   */
  get inversionRecuperada(): boolean {
    return this.dineroRecaudado.greaterThanOrEqualTo(this.inversionTotal);
  }

  /**
   * Porcentaje de avance en recaudo
   */
  get porcentajeRecaudo(): number {
    if (this.inversionTotal.isZero()) return 0;
    return this.dineroRecaudado
      .dividedBy(this.inversionTotal)
      .times(100)
      .toNumber();
  }

  /**
   * Máximo de regalos permitidos (8% del lote, redondeado hacia abajo)
   * Según sección 16.11
   */
  get maximoRegalos(): number {
    return Math.floor(this.cantidadTrabix * 0.08);
  }

  /**
   * Valida si el lote puede ser activado
   */
  validarActivacion(): void {
    if (this.estado !== 'CREADO') {
      throw new DomainException(
        'LOTE_004',
        'Solo se pueden activar lotes en estado CREADO',
        { estadoActual: this.estado },
      );
    }
  }

  /**
   * Valida si el lote puede ser finalizado
   */
  validarFinalizacion(): void {
    if (this.estado !== 'ACTIVO') {
      throw new DomainException(
        'LOTE_005',
        'Solo se pueden finalizar lotes en estado ACTIVO',
        { estadoActual: this.estado },
      );
    }
  }

  /**
   * Valida si se puede registrar una venta en este lote
   */
  validarParaVenta(): void {
    if (this.estado !== 'ACTIVO') {
      throw new DomainException(
        'LOTE_003',
        'No se pueden registrar ventas en un lote que no está activo',
        { estadoActual: this.estado },
      );
    }
  }
}

/**
 * Props para crear una entidad Lote
 */
export interface LoteEntityProps {
  id: string;
  vendedorId: string;
  version: number;
  cantidadTrabix: number;
  modeloNegocio: ModeloNegocio;
  estado: EstadoLote;
  inversionTotal: Decimal | string | number;
  inversionAdmin: Decimal | string | number;
  inversionVendedor: Decimal | string | number;
  dineroRecaudado: Decimal | string | number;
  dineroTransferido: Decimal | string | number;
  esLoteForzado: boolean;
  ventaMayorOrigenId: string | null;
  fechaCreacion: Date;
  fechaActivacion: Date | null;
  fechaFinalizacion: Date | null;
}

/**
 * Props para crear un nuevo lote
 */
export interface CrearLoteProps {
  vendedorId: string;
  cantidadTrabix: number;
  modeloNegocio: ModeloNegocio;
  esLoteForzado?: boolean;
  ventaMayorOrigenId?: string | null;
}
