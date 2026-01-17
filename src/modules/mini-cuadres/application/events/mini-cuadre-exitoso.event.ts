import { IEvent } from '@nestjs/cqrs';
import { Decimal } from 'decimal.js';

/**
 * Evento: Mini-Cuadre Exitoso
 * 
 * Trigger: Admin confirma mini-cuadre
 * 
 * Acciones (sección 23):
 * 1. Marcar última tanda como FINALIZADA
 * 2. Marcar lote como FINALIZADO
 * 3. Enviar notificación al vendedor
 */
export type NumericAmount = Decimal | number | string;

export class MiniCuadreExitosoEvent implements IEvent {
  constructor(
    public readonly miniCuadreId: string,
    public readonly loteId: string,
    public readonly tandaId: string,
    public readonly vendedorId: string,
    public readonly montoFinal: NumericAmount,
  ) {}
}
