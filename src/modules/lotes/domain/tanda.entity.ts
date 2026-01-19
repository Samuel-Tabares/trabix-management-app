import { EstadoTanda } from '@prisma/client';
import { DomainException } from '../../../domain/exceptions/domain.exception';

/**
 * Entidad de dominio Tanda
 * Según secciones 4.1-4.4 del documento
 * 
 * Una TANDA es simultáneamente:
 * - Unidad de liberación de stock
 * - Unidad de bloqueo / desbloqueo
 * - Unidad de riesgo financiero
 * - Unidad de control de progresión del lote
 * 
 * Estados: INACTIVA → LIBERADA → EN_TRÁNSITO → EN_CASA → FINALIZADA
 * Las tandas nunca retroceden de estado.
 */
export class TandaEntity {
  readonly id: string;
  readonly loteId: string;
  readonly version: number;
  readonly numero: number;
  readonly estado: EstadoTanda;
  readonly stockInicial: number;
  readonly stockActual: number;
  readonly stockConsumidoPorMayor: number;
  readonly liberadaPorCuadreMayorId: string | null;
  readonly fechaLiberacion: Date | null;
  readonly fechaEnTransito: Date | null;
  readonly fechaEnCasa: Date | null;
  readonly fechaFinalizada: Date | null;

  constructor(props: TandaEntityProps) {
    this.id = props.id;
    this.loteId = props.loteId;
    this.version = props.version;
    this.numero = props.numero;
    this.estado = props.estado;
    this.stockInicial = props.stockInicial;
    this.stockActual = props.stockActual;
    this.stockConsumidoPorMayor = props.stockConsumidoPorMayor;
    this.liberadaPorCuadreMayorId = props.liberadaPorCuadreMayorId;
    this.fechaLiberacion = props.fechaLiberacion;
    this.fechaEnTransito = props.fechaEnTransito;
    this.fechaEnCasa = props.fechaEnCasa;
    this.fechaFinalizada = props.fechaFinalizada;
  }

  /**
   * Stock consumido en ventas normales (sin contar ventas al mayor)
   */
  get stockConsumidoNormal(): number {
    return this.stockInicial - this.stockActual - this.stockConsumidoPorMayor;
  }

  /**
   * Porcentaje de stock restante
   */
  get porcentajeStockRestante(): number {
    if (this.stockInicial === 0) return 0;
    return (this.stockActual / this.stockInicial) * 100;
  }

  /**
   * Indica si la tanda está disponible para ventas
   * Solo EN_CASA permite ventas
   */
  get disponibleParaVentas(): boolean {
    return this.estado === 'EN_CASA' && this.stockActual > 0;
  }

  /**
   * Indica si debe transicionar a EN_TRÁNSITO automáticamente
   * (2 horas después de ser liberada)
   */
  debeTransicionarAEnTransito(ahora: Date = new Date()): boolean {
    if (this.estado !== 'LIBERADA' || !this.fechaLiberacion) {
      return false;
    }
    const dosHorasDespues = new Date(this.fechaLiberacion.getTime() + 2 * 60 * 60 * 1000);
    return ahora >= dosHorasDespues;
  }

  /**
   * Valida transición de estado usando State Pattern
   * Según sección 4.4: Las tandas nunca retroceden
   */
  validarTransicion(nuevoEstado: EstadoTanda): void {
    const transicionesValidas: Record<EstadoTanda, EstadoTanda[]> = {
      INACTIVA: ['LIBERADA'],
      LIBERADA: ['EN_TRANSITO'],
      EN_TRANSITO: ['EN_CASA'],
      EN_CASA: ['FINALIZADA'],
      FINALIZADA: [],
    };

    const permitidas = transicionesValidas[this.estado];
    
    if (!permitidas.includes(nuevoEstado)) {
      throw new DomainException(
        'TND_002',
        `Transición de estado inválida: ${this.estado} → ${nuevoEstado}`,
        { 
          estadoActual: this.estado, 
          estadoSolicitado: nuevoEstado,
          transicionesPermitidas: permitidas,
        },
      );
    }
  }

  /**
   * Valida si se puede liberar la tanda
   */
  validarLiberacion(): void {
    this.validarTransicion('LIBERADA');
  }

  /**
   * Valida si se puede confirmar entrega (EN_TRÁNSITO → EN_CASA)
   */
  validarConfirmacionEntrega(): void {
    if (this.estado !== 'EN_TRANSITO') {
      throw new DomainException(
        'TND_002',
        'Solo se puede confirmar entrega de tandas EN_TRÁNSITO',
        { estadoActual: this.estado },
      );
    }
  }

  /**
   * Valida si hay stock suficiente para una venta
   */
  validarStockParaVenta(cantidad: number): void {
    if (this.estado !== 'EN_CASA') {
      throw new DomainException(
        'VNT_002',
        'No hay tanda EN_CASA disponible para ventas',
        { estadoTanda: this.estado },
      );
    }

    if (this.stockActual < cantidad) {
      throw new DomainException(
        'VNT_001',
        'Stock insuficiente en la tanda',
        { stockDisponible: this.stockActual, cantidadSolicitada: cantidad },
      );
    }
  }
}

/**
 * Props para crear una entidad Tanda
 */
export interface TandaEntityProps {
  id: string;
  loteId: string;
  version: number;
  numero: number;
  estado: EstadoTanda;
  stockInicial: number;
  stockActual: number;
  stockConsumidoPorMayor: number;
  liberadaPorCuadreMayorId: string | null;
  fechaLiberacion: Date | null;
  fechaEnTransito: Date | null;
  fechaEnCasa: Date | null;
  fechaFinalizada: Date | null;
}

/**
 * Props para crear una nueva tanda
 */
export interface CrearTandaProps {
  loteId: string;
  numero: number;
  stockInicial: number;
}
