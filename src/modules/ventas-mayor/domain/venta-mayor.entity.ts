import { ModalidadVentaMayor, EstadoVentaMayor } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { DomainException } from '../../../domain/exceptions/domain.exception';

/**
 * Precios al mayor según sección 16.4 del documento
 */
export const PRECIOS_MAYOR = {
  CON_LICOR: [
    { minCantidad: 101, precio: 4500 },
    { minCantidad: 51, precio: 4700 },
    { minCantidad: 21, precio: 4900 },
  ],
  SIN_LICOR: [
    { minCantidad: 101, precio: 4200 },
    { minCantidad: 51, precio: 4500 },
    { minCantidad: 21, precio: 4800 },
  ],
};

/**
 * Tipos de fuente de stock
 */
export type TipoFuenteStock = 'RESERVADO' | 'EN_CASA' | 'LOTE_FORZADO';

/**
 * Fuente de stock para venta al mayor
 */
export interface FuenteStock {
  tandaId: string;
  cantidadConsumida: number;
  tipoStock: TipoFuenteStock;
}

/**
 * Entidad de dominio VentaMayor
 * Según sección 7 del documento
 * 
 * Una venta al mayor es una venta de >20 unidades que:
 * - Se gestiona directamente con Admin
 * - Tiene transferencia de dinero inmediata a Admin
 * - Puede consumir stock de múltiples fuentes
 * - Genera un CUADRE AL MAYOR único
 */
export class VentaMayorEntity {
  readonly id: string;
  readonly vendedorId: string;
  readonly cantidadUnidades: number;
  readonly precioUnidad: Decimal;
  readonly ingresoBruto: Decimal;
  readonly conLicor: boolean;
  readonly modalidad: ModalidadVentaMayor;
  readonly estado: EstadoVentaMayor;
  readonly fuentesStock: FuenteStock[];
  readonly lotesInvolucradosIds: string[];
  readonly loteForzadoId: string | null;
  readonly fechaRegistro: Date;
  readonly fechaCompletada: Date | null;

  constructor(props: VentaMayorEntityProps) {
    this.id = props.id;
    this.vendedorId = props.vendedorId;
    this.cantidadUnidades = props.cantidadUnidades;
    this.precioUnidad = new Decimal(props.precioUnidad);
    this.ingresoBruto = new Decimal(props.ingresoBruto);
    this.conLicor = props.conLicor;
    this.modalidad = props.modalidad;
    this.estado = props.estado;
    this.fuentesStock = props.fuentesStock || [];
    this.lotesInvolucradosIds = props.lotesInvolucradosIds || [];
    this.loteForzadoId = props.loteForzadoId;
    this.fechaRegistro = props.fechaRegistro;
    this.fechaCompletada = props.fechaCompletada;
  }

  /**
   * Indica si la venta está pendiente
   */
  get estaPendiente(): boolean {
    return this.estado === 'PENDIENTE';
  }

  /**
   * Indica si la venta fue completada
   */
  get estaCompletada(): boolean {
    return this.estado === 'COMPLETADA';
  }

  /**
   * Indica si requiere lote forzado
   */
  get requiereLoteForzado(): boolean {
    return this.loteForzadoId !== null;
  }

  /**
   * Valida que se puede completar la venta
   */
  validarCompletar(): void {
    if (this.estado !== 'PENDIENTE') {
      throw new DomainException(
        'VMA_001',
        'Solo se pueden completar ventas en estado PENDIENTE',
        { estadoActual: this.estado },
      );
    }
  }

  /**
   * Calcula el precio unitario según cantidad y tipo
   * Según sección 16.4
   */
  static calcularPrecioUnidad(cantidad: number, conLicor: boolean): Decimal {
    const precios = conLicor ? PRECIOS_MAYOR.CON_LICOR : PRECIOS_MAYOR.SIN_LICOR;
    
    for (const rango of precios) {
      if (cantidad >= rango.minCantidad) {
        return new Decimal(rango.precio);
      }
    }
    
    // Por defecto el precio más bajo del rango (>20)
      return new Decimal(precios.at(-1)!.precio);
  }

  /**
   * Calcula el ingreso bruto
   * ingreso_bruto_mayor = cantidad × precio_unidad
   */
  static calcularIngresoBruto(cantidad: number, precioUnidad: Decimal): Decimal {
    return precioUnidad.times(cantidad);
  }

  /**
   * Valida cantidad mínima para venta al mayor (>20)
   */
  static validarCantidadMinima(cantidad: number): void {
    if (cantidad <= 20) {
      throw new DomainException(
        'VMA_002',
        'La cantidad para venta al mayor debe ser mayor a 20 unidades',
        { cantidad },
      );
    }
  }
}

/**
 * Props para crear una entidad VentaMayor
 */
export interface VentaMayorEntityProps {
  id: string;
  vendedorId: string;
  cantidadUnidades: number;
  precioUnidad: Decimal | string | number;
  ingresoBruto: Decimal | string | number;
  conLicor: boolean;
  modalidad: ModalidadVentaMayor;
  estado: EstadoVentaMayor;
  fuentesStock?: FuenteStock[];
  lotesInvolucradosIds?: string[];
  loteForzadoId: string | null;
  fechaRegistro: Date;
  fechaCompletada: Date | null;
}

/**
 * Datos para crear una venta al mayor
 */
export interface CrearVentaMayorData {
  vendedorId: string;
  cantidadUnidades: number;
  conLicor: boolean;
  modalidad: ModalidadVentaMayor;
}
