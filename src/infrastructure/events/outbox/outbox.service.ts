import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Interfaz para mensajes del Outbox
 */
export interface OutboxMessage {
  eventType: string;
  payload: Record<string, any>;
}

/**
 * Outbox Service
 * Según sección 23 del documento: Outbox Pattern para eventos confiables
 * 
 * FLUJO:
 * 1. Use case ejecuta lógica de negocio en transacción
 * 2. Eventos se guardan en tabla Outbox dentro de la misma transacción
 * 3. Outbox Processor lee eventos pendientes y los publica
 * 4. Event Handlers procesan los eventos
 * 
 * GARANTÍAS:
 * - At-least-once delivery
 * - Handlers deben ser idempotentes
 * - Fallos se reintentan con backoff exponencial (máx 3 reintentos)
 */
@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);
  private readonly MAX_RETRIES = 3;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Guarda un mensaje en el outbox
   * Debe llamarse dentro de una transacción Prisma
   */
  async save(message: OutboxMessage, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx || this.prisma;

    await client.outbox.create({
      data: {
        eventType: message.eventType,
        payload: message.payload,
      },
    });

    this.logger.debug(`Mensaje agregado al outbox: ${message.eventType}`);
  }

  /**
   * Guarda múltiples mensajes en el outbox
   */
  async saveMany(
    messages: OutboxMessage[],
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx || this.prisma;

    await client.outbox.createMany({
      data: messages.map((m) => ({
        eventType: m.eventType,
        payload: m.payload,
      })),
    });

    this.logger.debug(`${messages.length} mensajes agregados al outbox`);
  }

  /**
   * Obtiene mensajes pendientes de procesar
   */
  async getPendingMessages(limit: number = 100): Promise<any[]> {
    return this.prisma.outbox.findMany({
      where: {
        processedAt: null,
        retries: { lt: this.MAX_RETRIES },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  /**
   * Marca un mensaje como procesado
   */
  async markAsProcessed(id: string): Promise<void> {
    await this.prisma.outbox.update({
      where: { id },
      data: { processedAt: new Date() },
    });
  }

  /**
   * Marca un mensaje como fallido e incrementa reintentos
   */
  async markAsFailed(id: string, error: string): Promise<void> {
    await this.prisma.outbox.update({
      where: { id },
      data: {
        error,
        retries: { increment: 1 },
      },
    });
  }

  /**
   * Elimina mensajes procesados antiguos
   * Según documento: elimina eventos procesados con más de 7 días
   */
  async cleanupProcessed(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.outbox.deleteMany({
      where: {
        processedAt: {
          not: null,
          lt: cutoffDate,
        },
      },
    });

    if (result.count > 0) {
      this.logger.log(`Limpieza de outbox: ${result.count} mensajes eliminados`);
    }

    return result.count;
  }

  /**
   * Obtiene estadísticas del outbox
   */
  async getStats(): Promise<{
    pending: number;
    processed: number;
    failed: number;
  }> {
    const [pending, processed, failed] = await Promise.all([
      this.prisma.outbox.count({
        where: { processedAt: null, retries: { lt: this.MAX_RETRIES } },
      }),
      this.prisma.outbox.count({
        where: { processedAt: { not: null } },
      }),
      this.prisma.outbox.count({
        where: { processedAt: null, retries: { gte: this.MAX_RETRIES } },
      }),
    ]);

    return { pending, processed, failed };
  }
}
