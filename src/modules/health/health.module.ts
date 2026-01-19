import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaHealthIndicator } from '@nestjs/terminus';
import { HealthController } from '../../presentation/http/controllers/health.controller';
import { RedisHealthIndicator } from './redis.health';

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
