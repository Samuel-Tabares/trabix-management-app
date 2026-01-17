import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { RedisHealthIndicator } from '../../../modules/health/redis.health';
import { Public } from '../../../modules/auth/decorators/public.decorator';

/**
 * Health Check Controller
 * Según sección 20.1 del documento:
 * - GET /health - Estado general del sistema
 * - GET /health/db - Estado de base de datos
 * - GET /health/redis - Estado de Redis
 */
@ApiTags('Health')
@Controller('health')
@Public() // Todos los endpoints de health son públicos
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Estado general del sistema' })
  @ApiResponse({ status: 200, description: 'Sistema saludable' })
  @ApiResponse({ status: 503, description: 'Sistema no saludable' })
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }

  @Get('db')
  @HealthCheck()
  @ApiOperation({ summary: 'Estado de base de datos' })
  @ApiResponse({ status: 200, description: 'Base de datos saludable' })
  @ApiResponse({ status: 503, description: 'Base de datos no saludable' })
  async checkDatabase(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
    ]);
  }

  @Get('redis')
  @HealthCheck()
  @ApiOperation({ summary: 'Estado de Redis' })
  @ApiResponse({ status: 200, description: 'Redis saludable' })
  @ApiResponse({ status: 503, description: 'Redis no saludable' })
  async checkRedis(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }
}
