import { Tanda, EstadoTanda, Prisma } from '@prisma/client';
import { IVersionedRepository } from './base.repository.interface';

/**
 * Tipos para creación y actualización de Tanda
 */
export type CreateTandaInput = Prisma.TandaCreateInput;
export type UpdateTandaInput = Prisma.TandaUpdateInput;

/**
 * Tanda con relaciones cargadas
 */
export interface TandaConRelaciones extends Tanda {
  lote?: {
    id: string;
    vendedorId: string;
    cantidadTrabix: number;
    estado: string;
  };
  cuadre?: {
    id: string;
    estado: string;
    montoEsperado: number;
  };
}

/**
 * Interface del repositorio de Tandas
 * Según sección 4 y 17.3 del documento
 */
export interface ITandaRepository extends IVersionedRepository<Tanda, CreateTandaInput, UpdateTandaInput> {
  /**
   * Busca tandas por lote ordenadas por número
   */
  findByLote(loteId: string): Promise<Tanda[]>;

  /**
   * Busca una tanda por lote y número
   */
  findByLoteAndNumero(loteId: string, numero: number): Promise<Tanda | null>;

  /**
   * Busca la tanda EN_CASA de un lote (para ventas)
   */
  findTandaEnCasa(loteId: string): Promise<Tanda | null>;

  /**
   * Busca la tanda LIBERADA de un lote
   */
  findTandaLiberada(loteId: string): Promise<Tanda | null>;

  /**
   * Busca tandas por estado
   */
  findByEstado(estado: EstadoTanda): Promise<Tanda[]>;

  /**
   * Busca tandas LIBERADAS que deben transicionar a EN_TRANSITO
   * Según sección 4.4: Automático 2 horas después de ser liberada
   */
  findTandasParaAutoTransito(horasLimite: number): Promise<Tanda[]>;

  /**
   * Obtiene una tanda con sus relaciones
   */
  findByIdWithRelations(id: string): Promise<TandaConRelaciones | null>;

  /**
   * Actualiza el estado de una tanda
   */
  updateEstado(id: string, version: number, estado: EstadoTanda): Promise<Tanda>;

  /**
   * Libera una tanda (INACTIVA → LIBERADA)
   */
  liberar(id: string, version: number): Promise<Tanda>;

  /**
   * Transiciona a EN_TRANSITO (LIBERADA → EN_TRANSITO)
   */
  transitarAEnTransito(id: string, version: number): Promise<Tanda>;

  /**
   * Confirma entrega (EN_TRANSITO → EN_CASA)
   */
  confirmarEnCasa(id: string, version: number): Promise<Tanda>;

  /**
   * Finaliza la tanda (EN_CASA → FINALIZADA)
   */
  finalizar(id: string, version: number): Promise<Tanda>;

  /**
   * Reduce el stock de una tanda
   */
  reducirStock(id: string, version: number, cantidad: number): Promise<Tanda>;

  /**
   * Incrementa el stock consumido por mayor
   */
  incrementarStockConsumidoPorMayor(id: string, version: number, cantidad: number): Promise<Tanda>;

  /**
   * Obtiene la última tanda de un lote
   */
  findUltimaTanda(loteId: string): Promise<Tanda | null>;

  /**
   * Verifica si existe tanda LIBERADA en el lote
   */
  existeTandaLiberada(loteId: string): Promise<boolean>;

  /**
   * Calcula el porcentaje de stock consumido
   */
  getPorcentajeStockConsumido(id: string): Promise<number>;
}
