import { Equipamiento, EstadoEquipamiento } from '@prisma/client';
import { Decimal } from 'decimal.js';

/**
 * Datos para crear equipamiento
 */
export interface CreateEquipamientoData {
  vendedorId: string;
  tieneDeposito: boolean;
  depositoPagado?: Decimal;
  mensualidadActual: Decimal;
}

/**
 * Opciones para listar equipamientos
 */
export interface FindEquipamientosOptions {
  skip?: number;
  take?: number;
  where?: {
    estado?: EstadoEquipamiento;
    vendedorId?: string;
  };
}

/**
 * Resultado paginado
 */
export interface PaginatedEquipamientos {
  data: Equipamiento[];
  total: number;
  hasMore: boolean;
}

/**
 * Interface del repositorio de equipamiento
 */
export interface IEquipamientoRepository {
  /**
   * Busca equipamiento por ID
   */
  findById(id: string): Promise<Equipamiento | null>;

  /**
   * Busca equipamiento por vendedor
   */
  findByVendedorId(vendedorId: string): Promise<Equipamiento | null>;

  /**
   * Lista equipamientos
   */
  findAll(options: FindEquipamientosOptions): Promise<PaginatedEquipamientos>;

  /**
   * Crea un nuevo equipamiento
   */
  create(data: CreateEquipamientoData): Promise<Equipamiento>;

  /**
   * Activa el equipamiento (SOLICITADO → ACTIVO)
   */
  activar(id: string): Promise<Equipamiento>;

  /**
   * Registra pago de mensualidad
   */
  registrarPagoMensualidad(id: string): Promise<Equipamiento>;

  /**
   * Reporta daño (ACTIVO → DANADO)
   */
  reportarDano(id: string, tipoDano: 'NEVERA' | 'PIJAMA', monto: Decimal): Promise<Equipamiento>;

  /**
   * Reporta pérdida (ACTIVO → PERDIDO)
   */
  reportarPerdida(id: string, monto: Decimal): Promise<Equipamiento>;

  /**
   * Registra pago de daño
   */
  pagarDano(id: string, monto: Decimal): Promise<Equipamiento>;

  /**
   * Devuelve el equipamiento (ACTIVO → DEVUELTO)
   */
  devolver(id: string): Promise<Equipamiento>;

  /**
   * Devuelve el depósito
   */
  devolverDeposito(id: string): Promise<Equipamiento>;

  /**
   * Reactiva equipamiento dañado (DANADO → ACTIVO)
   */
  reactivar(id: string): Promise<Equipamiento>;
}

/**
 * Token de inyección para el repositorio
 */
export const EQUIPAMIENTO_REPOSITORY = Symbol('EQUIPAMIENTO_REPOSITORY');
