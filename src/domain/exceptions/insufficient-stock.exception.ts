import { DomainException } from './domain.exception';

/**
 * Excepción para stock insuficiente
 * Según secciones 5, 6.1, 7.3 del documento
 */
export class InsufficientStockException extends DomainException {
  constructor(
    stockDisponible: number,
    stockRequerido: number,
    context?: string,
    details?: Record<string, unknown>,
  ) {
    super(
      `Stock insuficiente${context ? ` para ${context}` : ''}: disponible ${stockDisponible}, requerido ${stockRequerido}`,
      'VNT_001',
      {
        stockDisponible,
        stockRequerido,
        deficit: stockRequerido - stockDisponible,
        ...details,
      },
    );
    this.name = 'InsufficientStockException';
  }
}
