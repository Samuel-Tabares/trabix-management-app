import { EstadoVenta, TipoVenta } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { DomainException } from '../../../domain/exceptions/domain.exception';

/**
 * Precios de venta según sección 16.3 del documento
 */
export const PRECIOS_VENTA: Record<TipoVenta, number> = {
  PROMO: 12000,      // 2 TRABIX con licor = $12,000
  UNIDAD: 8000,      // 1 TRABIX con licor = $8,000
  SIN_LICOR: 7000,   // 1 TRABIX sin licor = $7,000
  REGALO: 0,         // Regalo = $0
};

/**
 * Cantidad de TRABIX por tipo de venta
 */
export const TRABIX_POR_TIPO: Record<TipoVenta, number> = {
  PROMO: 2,      // PROMO consume 2 TRABIX
  UNIDAD: 1,     // UNIDAD consume 1 TRABIX
  SIN_LICOR: 1,  // SIN_LICOR consume 1 TRABIX
  REGALO: 1,     // REGALO consume 1 TRABIX
};

/**
 * Entidad de dominio Venta
 * Según sección 6 del documento
 * 
 * Flujo de venta al detal:
 * 1. Vendedor registra venta colectiva
 * 2. Venta queda en estado PENDIENTE
 * 3. Stock se reduce temporalmente
 * 4. Admin revisa:
 *    - Si APRUEBA: stock se reduce definitivamente, venta genera recaudo
 *    - Si RECHAZA: stock se revierte, venta se elimina sin efectos contables
 */
export class VentaEntity {
  readonly id: string;
  readonly vendedorId: string;
  readonly loteId: string;
  readonly tandaId: string;
  readonly estado: EstadoVenta;
  readonly montoTotal: Decimal;
  readonly cantidadTrabix: number;
  readonly fechaRegistro: Date;
  readonly fechaValidacion: Date | null;
  readonly detalles: DetalleVentaEntity[];

  constructor(props: VentaEntityProps) {
    this.id = props.id;
    this.vendedorId = props.vendedorId;
    this.loteId = props.loteId;
    this.tandaId = props.tandaId;
    this.estado = props.estado;
    this.montoTotal = new Decimal(props.montoTotal);
    this.cantidadTrabix = props.cantidadTrabix;
    this.fechaRegistro = props.fechaRegistro;
    this.fechaValidacion = props.fechaValidacion;
    this.detalles = props.detalles || [];
  }

  /**
   * Cantidad de regalos en esta venta
   */
  get cantidadRegalos(): number {
    return this.detalles
      .filter(d => d.tipo === 'REGALO')
      .reduce((sum, d) => sum + d.cantidad, 0);
  }

  /**
   * Indica si la venta incluye regalos
   */
  get incluyeRegalos(): boolean {
    return this.cantidadRegalos > 0;
  }

  /**
   * Indica si está pendiente de aprobación
   */
  get estaPendiente(): boolean {
    return this.estado === 'PENDIENTE';
  }

  /**
   * Valida si la venta puede ser aprobada
   */
  validarAprobacion(): void {
    if (this.estado !== 'PENDIENTE') {
      throw new DomainException(
        'VNT_003',
        'Solo se pueden aprobar ventas en estado PENDIENTE',
        { estadoActual: this.estado },
      );
    }
  }

  /**
   * Valida si la venta puede ser rechazada
   */
  validarRechazo(): void {
    if (this.estado !== 'PENDIENTE') {
      throw new DomainException(
        'VNT_004',
        'Solo se pueden rechazar ventas en estado PENDIENTE',
        { estadoActual: this.estado },
      );
    }
  }
}

/**
 * Entidad de detalle de venta
 */
export class DetalleVentaEntity {
  readonly id: string;
  readonly ventaId: string;
  readonly tipo: TipoVenta;
  readonly cantidad: number;
  readonly precioUnitario: Decimal;
  readonly subtotal: Decimal;

  constructor(props: DetalleVentaEntityProps) {
    this.id = props.id;
    this.ventaId = props.ventaId;
    this.tipo = props.tipo;
    this.cantidad = props.cantidad;
    this.precioUnitario = new Decimal(props.precioUnitario);
    this.subtotal = new Decimal(props.subtotal);
  }

  /**
   * Cantidad de TRABIX que consume este detalle
   */
  get trabixConsumidos(): number {
    return this.cantidad * TRABIX_POR_TIPO[this.tipo];
  }
}

/**
 * Props para crear una entidad Venta
 */
// Alias para los tipos permitidos en montoTotal
type MontoTotal = Decimal | string | number;

export interface VentaEntityProps {
    id: string;
    vendedorId: string;
    loteId: string;
    tandaId: string;
    estado: EstadoVenta;
    montoTotal: MontoTotal;
    cantidadTrabix: number;
    fechaRegistro: Date;
    fechaValidacion: Date | null;
    detalles?: DetalleVentaEntity[];
}


/**
 * Props para crear un detalle de venta
 */
export interface DetalleVentaEntityProps {
  id: string;
  ventaId: string;
  tipo: TipoVenta;
  cantidad: number;
  precioUnitario: Decimal | string | number;
  subtotal: Decimal | string | number;
}

/**
 * Datos para registrar una venta
 */
export interface RegistrarVentaData {
  vendedorId: string;
  detalles: {
    tipo: TipoVenta;
    cantidad: number;
  }[];
}
