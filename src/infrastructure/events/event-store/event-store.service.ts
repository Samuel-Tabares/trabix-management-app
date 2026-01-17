import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

/**
 * Interfaz para eventos del dominio
 */
export interface DomainEvent {
  eventName: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * EventStore Service
 * Según sección 23 del documento: Persistencia de eventos para auditoría
 * 
 * Responsabilidades:
 * - Persistir todos los eventos del dominio
 * - Proveer consultas para auditoría y replay
 */
@Injectable()
export class EventStoreService {
  private readonly logger = new Logger(EventStoreService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persiste un evento en el EventStore
   */
  async persist(event: DomainEvent): Promise<void> {
    try {
      await this.prisma.eventStore.create({
        data: {
          eventName: event.eventName,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          payload: event.payload,
          metadata: event.metadata || {},
        },
      });

      this.logger.debug(
        `Evento persistido: ${event.eventName} - ${event.aggregateType}:${event.aggregateId}`,
      );
    } catch (error) {
      this.logger.error(`Error persistiendo evento: ${event.eventName}`, error);
      throw error;
    }
  }

  /**
   * Persiste múltiples eventos en una transacción
   */
  async persistMany(events: DomainEvent[]): Promise<void> {
    try {
      await this.prisma.eventStore.createMany({
        data: events.map((event) => ({
          eventName: event.eventName,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          payload: event.payload,
          metadata: event.metadata || {},
        })),
      });

      this.logger.debug(`${events.length} eventos persistidos`);
    } catch (error) {
      this.logger.error('Error persistiendo eventos', error);
      throw error;
    }
  }

  /**
   * Obtiene eventos por aggregate
   */
  async getEventsByAggregate(
    aggregateType: string,
    aggregateId: string,
  ): Promise<any[]> {
    return this.prisma.eventStore.findMany({
      where: { aggregateType, aggregateId },
      orderBy: { occurredOn: 'asc' },
    });
  }

  /**
   * Obtiene eventos por nombre
   */
  async getEventsByName(
    eventName: string,
    options?: { from?: Date; to?: Date; limit?: number },
  ): Promise<any[]> {
    const where: any = { eventName };

    if (options?.from || options?.to) {
      where.occurredOn = {};
      if (options.from) where.occurredOn.gte = options.from;
      if (options.to) where.occurredOn.lte = options.to;
    }

    return this.prisma.eventStore.findMany({
      where,
      orderBy: { occurredOn: 'desc' },
      take: options?.limit || 100,
    });
  }

  /**
   * Obtiene todos los eventos en un rango de tiempo
   */
  async getEventsByTimeRange(from: Date, to: Date): Promise<any[]> {
    return this.prisma.eventStore.findMany({
      where: {
        occurredOn: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { occurredOn: 'asc' },
    });
  }
}
