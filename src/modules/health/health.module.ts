import { Module } from '@nestjs/common';
import { TerminusModule,PrismaHealthIndicator } from '@nestjs/terminus';
import { HealthController } from '@/presentation';
import { RedisHealthIndicator } from '@/modules';

/**
 * Módulo de Health Checks
 * Según sección 20.1 del documento
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [RedisHealthIndicator, PrismaHealthIndicator],
  exports: [RedisHealthIndicator],
})
export class HealthModule {}
