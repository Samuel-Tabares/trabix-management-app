import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Unit of Work Pattern
 * Según sección 18.3 - Patrones de diseño aplicados
 * 
 * Permite ejecutar múltiples operaciones de base de datos
 * dentro de una única transacción atómica.
 */
@Injectable()
export class UnitOfWork {
  private readonly logger = new Logger(UnitOfWork.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ejecuta una función dentro de una transacción
   * Si la función lanza una excepción, la transacción se revierte
   * 
   * @param fn - Función que recibe el cliente transaccional de Prisma
   * @returns El resultado de la función
   */
  async execute<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      try {
        return await fn(tx);
      } catch (error) {
        this.logger.error('Error en transacción, ejecutando rollback', error);
        throw error;
      }
    });
  }

  /**
   * Ejecuta una función dentro de una transacción con opciones personalizadas
   * 
   * @param fn - Función que recibe el cliente transaccional de Prisma
   * @param options - Opciones de la transacción (timeout, isolation level)
   * @returns El resultado de la función
   */
  async executeWithOptions<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<T> {
    return this.prisma.$transaction(
      async (tx) => {
        try {
          return await fn(tx);
        } catch (error) {
          this.logger.error('Error en transacción, ejecutando rollback', error);
          throw error;
        }
      },
      {
        maxWait: options?.maxWait ?? 5000,
        timeout: options?.timeout ?? 10000,
        isolationLevel: options?.isolationLevel ?? Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );
  }

  /**
   * Ejecuta múltiples operaciones de escritura en una transacción
   * Útil para operaciones batch
   * 
   * @param operations - Array de promesas de Prisma
   * @returns Array con los resultados de cada operación
   */
  async batch<T extends Prisma.PrismaPromise<unknown>[]>(
      operations: [...T],
  ): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
      return this.prisma.$transaction(operations) as Promise<{
          [K in keyof T]: Awaited<T[K]>;
      }>;
  }

}
