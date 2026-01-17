import { Decimal } from 'decimal.js';
import { EstadoPedidoStock } from '@prisma/client';
import { DomainException } from '@/domain';

// ========== PedidoStock Entity ==========

export class PedidoStockEntity {
  readonly id: string;
  readonly cantidadTrabix: number;
  readonly estado: EstadoPedidoStock;
  readonly costoTotal: Decimal;
  readonly costoRealPorTrabix: Decimal;
  readonly detallesCosto: DetalleCostoEntity[];
  readonly fechaCreacion: Date;
  readonly notas: string | null;

  constructor(props: PedidoStockProps) {
    this.id = props.id;
    this.cantidadTrabix = props.cantidadTrabix;
    this.estado = props.estado;
    this.costoTotal = new Decimal(props.costoTotal || 0);
    this.costoRealPorTrabix = new Decimal(props.costoRealPorTrabix || 0);
    this.detallesCosto = props.detallesCosto || [];
    this.fechaCreacion = props.fechaCreacion;
    this.notas = props.notas;
  }

  /**
   * Calcula el costo total sumando todos los detalles
   */
  calcularCostoTotal(): Decimal {
    return this.detallesCosto.reduce(
      (sum, detalle) => sum.plus(detalle.costoTotal),
      new Decimal(0),
    );
  }

  /**
   * Calcula el costo real por TRABIX
   * COSTO_REAL_POR_TRABIX = SUMA_TOTAL_COSTOS / CANTIDAD_TRABIX
   */
  calcularCostoRealPorTrabix(): Decimal {
    const total = this.calcularCostoTotal();
    if (this.cantidadTrabix === 0) return new Decimal(0);
    return total.dividedBy(this.cantidadTrabix);
  }

  /**
   * Verifica si tiene todos los insumos obligatorios
   */
  tieneInsumosObligatorios(insumosObligatorios: string[]): boolean {
    const conceptosRegistrados = this.detallesCosto
      .filter((d) => d.esObligatorio)
      .map((d) => d.concepto.toLowerCase());

    return insumosObligatorios.every((insumo) =>
      conceptosRegistrados.some((c) => c.includes(insumo.toLowerCase())),
    );
  }

  /**
   * Valida que se puede agregar un costo
   */
  validarAgregarCosto(): void {
    if (this.estado !== 'BORRADOR') {
      throw new DomainException(
        'PED_001',
        'Solo se pueden agregar costos a pedidos en estado BORRADOR',
        { estadoActual: this.estado },
      );
    }
  }

  /**
   * Valida que se puede confirmar el pedido
   */
  validarConfirmacion(insumosObligatorios: string[]): void {
    if (this.estado !== 'BORRADOR') {
      throw new DomainException(
        'PED_002',
        'Solo se pueden confirmar pedidos en estado BORRADOR',
        { estadoActual: this.estado },
      );
    }

    if (!this.tieneInsumosObligatorios(insumosObligatorios)) {
      throw new DomainException(
        'PED_003',
        'Faltan insumos obligatorios',
        { insumosObligatorios },
      );
    }

    if (this.detallesCosto.length === 0) {
      throw new DomainException('PED_004', 'El pedido no tiene detalles de costo');
    }
  }

  /**
   * Valida que se puede marcar como recibido
   */
  validarRecepcion(): void {
    if (this.estado !== 'CONFIRMADO') {
      throw new DomainException(
        'PED_005',
        'Solo se pueden recibir pedidos en estado CONFIRMADO',
        { estadoActual: this.estado },
      );
    }
  }
}

export interface PedidoStockProps {
  id: string;
  cantidadTrabix: number;
  estado: EstadoPedidoStock;
  costoTotal: Decimal | string | number;
  costoRealPorTrabix: Decimal | string | number;
  detallesCosto?: DetalleCostoEntity[];
  fechaCreacion: Date;
  notas: string | null;
}

// ========== DetalleCosto Entity ==========

export class DetalleCostoEntity {
  readonly id: string;
  readonly pedidoId: string;
  readonly concepto: string;
  readonly esObligatorio: boolean;
  readonly cantidad: number | null;
  readonly costoTotal: Decimal;
  readonly fechaRegistro: Date;

  constructor(props: DetalleCostoProps) {
    this.id = props.id;
    this.pedidoId = props.pedidoId;
    this.concepto = props.concepto;
    this.esObligatorio = props.esObligatorio;
    this.cantidad = props.cantidad;
    this.costoTotal = new Decimal(props.costoTotal);
    this.fechaRegistro = props.fechaRegistro;
  }
}

export interface DetalleCostoProps {
  id: string;
  pedidoId: string;
  concepto: string;
  esObligatorio: boolean;
  cantidad: number | null;
  costoTotal: Decimal | string | number;
  fechaRegistro: Date;
}

// ========== ConfiguracionSistema Entity ==========

export class ConfiguracionSistemaEntity {
  readonly id: string;
  readonly clave: string;
  readonly valor: string;
  readonly tipo: string;
  readonly descripcion: string;
  readonly categoria: string;
  readonly modificable: boolean;
  readonly ultimaModificacion: Date;
  readonly modificadoPorId: string | null;

  constructor(props: ConfiguracionSistemaProps) {
    this.id = props.id;
    this.clave = props.clave;
    this.valor = props.valor;
    this.tipo = props.tipo;
    this.descripcion = props.descripcion;
    this.categoria = props.categoria;
    this.modificable = props.modificable;
    this.ultimaModificacion = props.ultimaModificacion;
    this.modificadoPorId = props.modificadoPorId;
  }

  /**
   * Obtiene el valor como número
   */
  getValorNumerico(): number {
    return Number.parseFloat(this.valor);
  }

  /**
   * Obtiene el valor como Decimal
   */
  getValorDecimal(): Decimal {
    return new Decimal(this.valor);
  }

  /**
   * Valida que se puede modificar
   */
  validarModificacion(): void {
    if (!this.modificable) {
      throw new DomainException(
        'CFG_001',
        'Esta configuración no es modificable',
        { clave: this.clave },
      );
    }
  }
}

export interface ConfiguracionSistemaProps {
  id: string;
  clave: string;
  valor: string;
  tipo: string;
  descripcion: string;
  categoria: string;
  modificable: boolean;
  ultimaModificacion: Date;
  modificadoPorId: string | null;
}

// ========== TipoInsumo Entity ==========

export class TipoInsumoEntity {
  readonly id: string;
  readonly nombre: string;
  readonly esObligatorio: boolean;
  readonly activo: boolean;
  readonly fechaCreacion: Date;

  constructor(props: TipoInsumoProps) {
    this.id = props.id;
    this.nombre = props.nombre;
    this.esObligatorio = props.esObligatorio;
    this.activo = props.activo;
    this.fechaCreacion = props.fechaCreacion;
  }

  /**
   * Valida que se puede desactivar
   */
  validarDesactivacion(): void {
    if (this.esObligatorio) {
      throw new DomainException(
        'INS_001',
        'No se pueden desactivar tipos de insumo obligatorios',
        { nombre: this.nombre },
      );
    }
  }
}

export interface TipoInsumoProps {
  id: string;
  nombre: string;
  esObligatorio: boolean;
  activo: boolean;
  fechaCreacion: Date;
}

// ========== StockAdmin Entity ==========

export class StockAdminEntity {
  readonly id: string;
  readonly stockFisico: number;
  readonly ultimoPedidoId: string | null;
  readonly ultimaActualizacion: Date;

  constructor(props: StockAdminProps) {
    this.id = props.id;
    this.stockFisico = props.stockFisico;
    this.ultimoPedidoId = props.ultimoPedidoId;
    this.ultimaActualizacion = props.ultimaActualizacion;
  }
}

export interface StockAdminProps {
  id: string;
  stockFisico: number;
  ultimoPedidoId: string | null;
  ultimaActualizacion: Date;
}
