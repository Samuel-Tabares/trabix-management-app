import { EstadoEquipamiento } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { DomainException } from '@/domain';

/**
 * Constantes de equipamiento según sección 10
 */
export const EQUIPAMIENTO_CONFIG = {
  // Mensualidad con depósito: $9,990
  MENSUALIDAD_CON_DEPOSITO: new Decimal(9990),
  // Mensualidad sin depósito: $19,990
  MENSUALIDAD_SIN_DEPOSITO: new Decimal(19990),
  // Depósito inicial: $49,990
  DEPOSITO_INICIAL: new Decimal(49990),
  // Costo por daño de nevera: $30,000
  COSTO_DANO_NEVERA: new Decimal(30000),
  // Costo por daño/pérdida de pijama: $60,000
  COSTO_DANO_PIJAMA: new Decimal(60000),
  // Costo total por pérdida (nevera + pijama): $90,000
  COSTO_PERDIDA_TOTAL: new Decimal(90000),
};

/**
 * Entidad de dominio Equipamiento
 * Según sección 10 del documento
 * 
 * El equipamiento es voluntario, incluye nevera+pijama.
 * Es propiedad de TRABIX y requiere mensualidad.
 */
export class EquipamientoEntity {
  readonly id: string;
  readonly vendedorId: string;
  readonly estado: EstadoEquipamiento;
  readonly tieneDeposito: boolean;
  readonly depositoPagado: Decimal | null;
  readonly mensualidadActual: Decimal;
  readonly ultimaMensualidadPagada: Date | null;
  readonly deudaDano: Decimal;
  readonly deudaPerdida: Decimal;
  readonly fechaSolicitud: Date;
  readonly fechaEntrega: Date | null;
  readonly fechaDevolucion: Date | null;
  readonly depositoDevuelto: boolean;
  readonly fechaDevolucionDeposito: Date | null;

  constructor(props: EquipamientoEntityProps) {
    this.id = props.id;
    this.vendedorId = props.vendedorId;
    this.estado = props.estado;
    this.tieneDeposito = props.tieneDeposito;
    this.depositoPagado = props.depositoPagado ? new Decimal(props.depositoPagado) : null;
    this.mensualidadActual = new Decimal(props.mensualidadActual);
    this.ultimaMensualidadPagada = props.ultimaMensualidadPagada;
    this.deudaDano = new Decimal(props.deudaDano || 0);
    this.deudaPerdida = new Decimal(props.deudaPerdida || 0);
    this.fechaSolicitud = props.fechaSolicitud;
    this.fechaEntrega = props.fechaEntrega;
    this.fechaDevolucion = props.fechaDevolucion;
    this.depositoDevuelto = props.depositoDevuelto;
    this.fechaDevolucionDeposito = props.fechaDevolucionDeposito;
  }

  /**
   * Calcula la mensualidad según si tiene depósito o no
   */
  static calcularMensualidad(tieneDeposito: boolean): Decimal {
    return tieneDeposito
      ? EQUIPAMIENTO_CONFIG.MENSUALIDAD_CON_DEPOSITO
      : EQUIPAMIENTO_CONFIG.MENSUALIDAD_SIN_DEPOSITO;
  }

  /**
   * Indica si el equipamiento está activo
   */
  get estaActivo(): boolean {
    return this.estado === 'ACTIVO';
  }

  /**
   * Indica si tiene deudas pendientes
   */
  get tieneDeudas(): boolean {
    return this.deudaDano.greaterThan(0) || this.deudaPerdida.greaterThan(0);
  }

  /**
   * Calcula la deuda total de equipamiento
   */
  get deudaTotal(): Decimal {
    return this.deudaDano.plus(this.deudaPerdida);
  }

  /**
   * Verifica si la mensualidad está al día
   */
  mensualidadAlDia(): boolean {
    if (!this.ultimaMensualidadPagada || !this.fechaEntrega) {
      return false;
    }
    
    const ahora = new Date();
    const ultimoPago = new Date(this.ultimaMensualidadPagada);
    const diasDesdeUltimoPago = Math.floor(
      (ahora.getTime() - ultimoPago.getTime()) / (1000 * 60 * 60 * 24),
    );
    
    // Mensualidad es por 30 días
    return diasDesdeUltimoPago <= 30;
  }

  /**
   * Valida que se puede activar el equipamiento
   */
  validarActivacion(): void {
    if (this.estado !== 'SOLICITADO') {
      throw new DomainException(
        'EQU_001',
        'Solo se puede activar equipamiento en estado SOLICITADO',
        { estadoActual: this.estado },
      );
    }
  }

  /**
   * Valida que se puede devolver el equipamiento
   */
  validarDevolucion(): void {
    if (this.estado !== 'ACTIVO') {
      throw new DomainException(
        'EQU_002',
        'Solo se puede devolver equipamiento en estado ACTIVO',
        { estadoActual: this.estado },
      );
    }
  }

  /**
   * Valida que se puede reportar daño
   */
  validarReporteDano(): void {
    if (this.estado !== 'ACTIVO') {
      throw new DomainException(
        'EQU_003',
        'Solo se puede reportar daño en equipamiento ACTIVO',
        { estadoActual: this.estado },
      );
    }
  }

  /**
   * Valida que se puede reportar pérdida
   */
  validarReportePerdida(): void {
    if (this.estado !== 'ACTIVO') {
      throw new DomainException(
        'EQU_004',
        'Solo se puede reportar pérdida en equipamiento ACTIVO',
        { estadoActual: this.estado },
      );
    }
  }
}

/**
 * Props para crear una entidad Equipamiento
 */
export interface EquipamientoEntityProps {
  id: string;
  vendedorId: string;
  estado: EstadoEquipamiento;
  tieneDeposito: boolean;
  depositoPagado: Decimal | string | number | null;
  mensualidadActual: Decimal | string | number;
  ultimaMensualidadPagada: Date | null;
  deudaDano?: Decimal | string | number;
  deudaPerdida?: Decimal | string | number;
  fechaSolicitud: Date;
  fechaEntrega: Date | null;
  fechaDevolucion: Date | null;
  depositoDevuelto: boolean;
  fechaDevolucionDeposito: Date | null;
}
