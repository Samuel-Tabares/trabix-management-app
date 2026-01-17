import { ModalidadVentaMayor, EstadoCuadre } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { DomainException } from '@/domain';

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

/**
 * Entidad de dominio CuadreMayor
 * Según secciones 7.5, 7.6 y 8.3 del documento
 * 
 * Un cuadre al mayor es un super-cuadre que:
 * - Se genera por una venta al mayor
 * - Evalúa el estado financiero completo del vendedor
 * - Calcula la distribución correcta del dinero
 * - Puede marcar como EXITOSO los cuadres normales que queden cubiertos
 * - Libera tandas en cadena si corresponde
 */
export class CuadreMayorEntity {
  readonly id: string;
  readonly ventaMayorId: string;
  readonly vendedorId: string;
  readonly modalidad: ModalidadVentaMayor;
  readonly estado: EstadoCuadre;
  
  // Campos del registro (7.6)
  readonly cantidadUnidades: number;
  readonly precioUnidad: Decimal;
  readonly ingresoBruto: Decimal;
  
  // Desglose de dinero (7.6)
  readonly deudasSaldadas: Decimal;
  readonly inversionAdminLotesExistentes: Decimal;
  readonly inversionAdminLoteForzado: Decimal;
  readonly inversionVendedorLotesExistentes: Decimal;
  readonly inversionVendedorLoteForzado: Decimal;
  readonly gananciasAdmin: Decimal;
  readonly gananciasVendedor: Decimal;
  
  // Evaluación financiera completa (8.3)
  readonly evaluacionFinanciera: EvaluacionFinanciera;
  
  // Totales
  readonly montoTotalAdmin: Decimal;
  readonly montoTotalVendedor: Decimal;
  
  // Referencias
  readonly lotesInvolucradosIds: string[];
  readonly tandasAfectadas: TandaAfectada[];
  readonly cuadresCerradosIds: string[];
  readonly loteForzadoId: string | null;
  readonly gananciasReclutadores: GananciaReclutadorMayor[];
  
  readonly fechaRegistro: Date;
  readonly fechaExitoso: Date | null;

  constructor(props: CuadreMayorEntityProps) {
    this.id = props.id;
    this.ventaMayorId = props.ventaMayorId;
    this.vendedorId = props.vendedorId;
    this.modalidad = props.modalidad;
    this.estado = props.estado;
    
    this.cantidadUnidades = props.cantidadUnidades;
    this.precioUnidad = new Decimal(props.precioUnidad);
    this.ingresoBruto = new Decimal(props.ingresoBruto);
    
    this.deudasSaldadas = new Decimal(props.deudasSaldadas);
    this.inversionAdminLotesExistentes = new Decimal(props.inversionAdminLotesExistentes);
    this.inversionAdminLoteForzado = new Decimal(props.inversionAdminLoteForzado);
    this.inversionVendedorLotesExistentes = new Decimal(props.inversionVendedorLotesExistentes);
    this.inversionVendedorLoteForzado = new Decimal(props.inversionVendedorLoteForzado);
    this.gananciasAdmin = new Decimal(props.gananciasAdmin);
    this.gananciasVendedor = new Decimal(props.gananciasVendedor);
    
    this.evaluacionFinanciera = props.evaluacionFinanciera;
    
    this.montoTotalAdmin = new Decimal(props.montoTotalAdmin);
    this.montoTotalVendedor = new Decimal(props.montoTotalVendedor);
    
    this.lotesInvolucradosIds = props.lotesInvolucradosIds || [];
    this.tandasAfectadas = props.tandasAfectadas || [];
    this.cuadresCerradosIds = props.cuadresCerradosIds || [];
    this.loteForzadoId = props.loteForzadoId;
    this.gananciasReclutadores = props.gananciasReclutadores || [];
    
    this.fechaRegistro = props.fechaRegistro;
    this.fechaExitoso = props.fechaExitoso;
  }

  /**
   * Indica si el cuadre está pendiente
   */
  get estaPendiente(): boolean {
    return this.estado === 'PENDIENTE';
  }

  /**
   * Indica si el cuadre fue exitoso
   */
  get esExitoso(): boolean {
    return this.estado === 'EXITOSO';
  }

  /**
   * Indica si tiene lote forzado
   */
  get tieneLoteForzado(): boolean {
    return this.loteForzadoId !== null;
  }

  /**
   * Inversión total del admin
   */
  get inversionAdminTotal(): Decimal {
    return this.inversionAdminLotesExistentes.plus(this.inversionAdminLoteForzado);
  }

  /**
   * Inversión total del vendedor
   */
  get inversionVendedorTotal(): Decimal {
    return this.inversionVendedorLotesExistentes.plus(this.inversionVendedorLoteForzado);
  }

  /**
   * Valida que se puede confirmar el cuadre
   */
  validarConfirmacion(): void {
    if (this.estado !== 'PENDIENTE') {
      throw new DomainException(
        'CMA_001',
        'Solo se pueden confirmar cuadres en estado PENDIENTE',
        { estadoActual: this.estado },
      );
    }
  }
}

/**
 * Props para crear una entidad CuadreMayor
 */
export interface CuadreMayorEntityProps {
  id: string;
  ventaMayorId: string;
  vendedorId: string;
  modalidad: ModalidadVentaMayor;
  estado: EstadoCuadre;
  cantidadUnidades: number;
  precioUnidad: Decimal | string | number;
  ingresoBruto: Decimal | string | number;
  deudasSaldadas: Decimal | string | number;
  inversionAdminLotesExistentes: Decimal | string | number;
  inversionAdminLoteForzado: Decimal | string | number;
  inversionVendedorLotesExistentes: Decimal | string | number;
  inversionVendedorLoteForzado: Decimal | string | number;
  gananciasAdmin: Decimal | string | number;
  gananciasVendedor: Decimal | string | number;
  evaluacionFinanciera: EvaluacionFinanciera;
  montoTotalAdmin: Decimal | string | number;
  montoTotalVendedor: Decimal | string | number;
  lotesInvolucradosIds?: string[];
  tandasAfectadas?: TandaAfectada[];
  cuadresCerradosIds?: string[];
  loteForzadoId: string | null;
  gananciasReclutadores?: GananciaReclutadorMayor[];
  fechaRegistro: Date;
  fechaExitoso: Date | null;
}
