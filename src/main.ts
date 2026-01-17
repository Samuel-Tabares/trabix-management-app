import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { createWinstonLogger } from './shared/utils/logger.util';

// Filters
import {
  HttpExceptionFilter,
  DomainExceptionFilter,
  AllExceptionsFilter,
} from './presentation/http/filters';

// Interceptors
import {
  LoggingInterceptor,
  IdempotencyInterceptor,
} from './presentation/http/interceptors';

// Guards
import { JwtAuthGuard, RolesGuard } from './modules/auth/guards';

// Services
import { RedisService } from './infrastructure/cache/redis.service';

async function bootstrap() {
  // Crear logger de Winston para el bootstrap
  const logger = createWinstonLogger();

  // Crear la aplicación NestJS con Winston logger
  const app = await NestFactory.create(AppModule, {
    logger,
  });

  // Obtener servicios necesarios
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);
  const redisService = app.get(RedisService);

  // Configurar prefijo global de API
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Configurar versionamiento de API
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Configurar Helmet para headers de seguridad (sección 22.3)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Configurar CORS
  const corsOrigin = configService.get<string>('security.corsOrigin', 'http://localhost:3001');
  app.enableCors({
    origin: corsOrigin.split(',').map((origin) => origin.trim()),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Idempotency-Key',
      'X-Request-Id',
    ],
    credentials: true,
  });

  // Configurar ValidationPipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validateCustomDecorators: true,
    }),
  );

  // Configurar filtros globales (orden importante: del más específico al más general)
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new DomainExceptionFilter(),
    new HttpExceptionFilter(),
  );

  // Configurar interceptors globales
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new IdempotencyInterceptor(reflector, redisService),
  );

  // Configurar guards globales
  const jwtAuthGuard = app.get(JwtAuthGuard);
  const rolesGuard = app.get(RolesGuard);
  app.useGlobalGuards(jwtAuthGuard, rolesGuard);

  // Configurar Swagger/OpenAPI (solo en desarrollo)
  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('TRABIX Backend API')
      .setDescription(
        'API Backend para el sistema de gestión de ventas de granizados TRABIX. ' +
        'Incluye gestión de usuarios, lotes, tandas, ventas, cuadres, equipamiento y más.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Ingrese el token JWT',
          in: 'header',
        },
        'access-token',
      )
      .addTag('Health', 'Endpoints de estado del sistema')
      .addTag('Auth', 'Autenticación y autorización')
      .addTag('Usuarios', 'Gestión de usuarios y vendedores')
      .addTag('Lotes', 'Gestión de lotes de TRABIX')
      .addTag('Tandas', 'Gestión de tandas de lotes')
      .addTag('Ventas', 'Gestión de ventas al detal')
      .addTag('Ventas Mayor', 'Gestión de ventas al por mayor')
      .addTag('Cuadres', 'Gestión de cuadres normales')
      .addTag('Cuadres Mayor', 'Gestión de cuadres al mayor')
      .addTag('Mini-Cuadres', 'Gestión de mini-cuadres')
      .addTag('Equipamiento', 'Gestión de equipamiento')
      .addTag('Fondo Recompensas', 'Gestión del fondo de recompensas')
      .addTag('Notificaciones', 'Gestión de notificaciones')
      .addTag('Admin', 'Endpoints de administración')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(`📚 Swagger disponible en: http://localhost:${configService.get('app.port')}/docs`);
  }

  // Iniciar servidor
  const port = configService.get<number>('app.port', 3000);
  await app.listen(port);

  logger.log(`🚀 TRABIX Backend corriendo en: http://localhost:${port}/${apiPrefix}`);
  logger.log(`📊 Ambiente: ${nodeEnv}`);
}

bootstrap();
