import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ Conexión a PostgreSQL establecida');

    // Log de queries en desarrollo
    if (process.env.NODE_ENV === 'development') {
      // @ts-expect-error - Prisma event typing
      this.$on('query', (e: { query: string; duration: number }) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    // @ts-expect-error - Prisma event typing
    this.$on('error', (e: { message: string }) => {
      this.logger.error(`Prisma Error: ${e.message}`);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Conexión a PostgreSQL cerrada');
  }
}
