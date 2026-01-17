import { MiniCuadre, EstadoMiniCuadre } from '@prisma/client';
import { Decimal } from 'decimal.js';

/**
 * MiniCuadre con relaciones
 */
export interface MiniCuadreConRelaciones extends MiniCuadre {
  lote?: {
    id: string;
    vendedorId: string;
    estado: string;
    cantidadTrabix: number;
  };
}

/**
 * Datos para crear un mini-cuadre
 */
export interface CreateMiniCuadreData {
  loteId: string;
  tandaId: string;
}

/**
 * Interface del repositorio de mini-cuadres
 */
export interface IMiniCuadreRepository {
  /**
   * Busca un mini-cuadre por ID
   */
  findById(id: string): Promise<MiniCuadreConRelaciones | null>;

  /**
   * Busca un mini-cuadre por ID de lote
   */
  findByLoteId(loteId: string): Promise<MiniCuadreConRelaciones | null>;

  /**
   * Crea un nuevo mini-cuadre
   */
  create(data: CreateMiniCuadreData): Promise<MiniCuadre>;

  /**
   * Activa un mini-cuadre (INACTIVO → PENDIENTE)
   * Se llama cuando el stock de la última tanda llega a 0
   */
  activar(id: string, montoFinal: Decimal): Promise<MiniCuadre>;

  /**
   * Confirma un mini-cuadre como exitoso (PENDIENTE → EXITOSO)
   * Se llama cuando el admin confirma la consolidación final
   */
  confirmarExitoso(id: string): Promise<MiniCuadre>;

  /**
   * Lista mini-cuadres por estado
   */
  findByEstado(estado: EstadoMiniCuadre): Promise<MiniCuadreConRelaciones[]>;

  /**
   * Cuenta mini-cuadres por estado
   */
  countByEstado(estado: EstadoMiniCuadre): Promise<number>;
}

/**
 * Token de inyección para el repositorio
 */
export const MINI_CUADRE_REPOSITORY = Symbol('MINI_CUADRE_REPOSITORY');
