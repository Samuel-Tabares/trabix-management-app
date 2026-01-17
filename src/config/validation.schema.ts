import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Aplicación
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api/v1'),

  // Base de datos (REQUERIDO)
  DATABASE_URL: Joi.string().required().messages({
    'any.required': 'DATABASE_URL es requerido para conectar a PostgreSQL',
  }),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_URL: Joi.string().required().messages({
    'any.required': 'REDIS_URL es requerido para conectar a Redis',
  }),

  // Queue (Bull)
  BULL_REDIS_URL: Joi.string().optional(),

  // JWT (REQUERIDO)
  JWT_SECRET: Joi.string().min(32).required().messages({
    'any.required': 'JWT_SECRET es requerido para autenticación',
    'string.min': 'JWT_SECRET debe tener al menos 32 caracteres',
  }),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required().messages({
    'any.required': 'JWT_REFRESH_SECRET es requerido para refresh tokens',
    'string.min': 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres',
  }),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  // Seguridad
  BCRYPT_ROUNDS: Joi.number().min(4).max(16).default(12),
  RATE_LIMIT_TTL: Joi.number().default(60),
  RATE_LIMIT_MAX: Joi.number().default(100),
  CORS_ORIGIN: Joi.string().default('http://localhost:3001'),

  // Negocio - Precios
  COSTO_PERCIBIDO_TRABIX: Joi.number().default(2400),
  APORTE_FONDO_POR_TRABIX: Joi.number().default(200),
  PRECIO_UNIDAD_LICOR: Joi.number().default(8000),
  PRECIO_PROMO_LICOR: Joi.number().default(12000),
  PRECIO_UNIDAD_SIN_LICOR: Joi.number().default(7000),

  // Precios al mayor
  PRECIO_MAYOR_20_LICOR: Joi.number().default(4900),
  PRECIO_MAYOR_50_LICOR: Joi.number().default(4700),
  PRECIO_MAYOR_100_LICOR: Joi.number().default(4500),
  PRECIO_MAYOR_20_SIN_LICOR: Joi.number().default(4800),
  PRECIO_MAYOR_50_SIN_LICOR: Joi.number().default(4500),
  PRECIO_MAYOR_100_SIN_LICOR: Joi.number().default(4200),

  // Equipamiento
  MENSUALIDAD_CON_DEPOSITO: Joi.number().default(9990),
  MENSUALIDAD_SIN_DEPOSITO: Joi.number().default(19990),
  DEPOSITO_EQUIPAMIENTO: Joi.number().default(49990),
  COSTO_DANO_NEVERA: Joi.number().default(30000),
  COSTO_DANO_PIJAMA: Joi.number().default(60000),

  // Porcentajes
  PORCENTAJE_VENDEDOR_60_40: Joi.number().min(0).max(100).default(60),
  PORCENTAJE_ADMIN_60_40: Joi.number().min(0).max(100).default(40),
  PORCENTAJE_VENDEDOR_50_50: Joi.number().min(0).max(100).default(50),
  PORCENTAJE_INVERSION: Joi.number().min(0).max(100).default(50),
  LIMITE_REGALOS: Joi.number().min(0).max(100).default(8),
  TRIGGER_CUADRE_T2: Joi.number().min(0).max(100).default(10),
  TRIGGER_CUADRE_T3: Joi.number().min(0).max(100).default(20),
  TRIGGER_CUADRE_T1_2TANDAS: Joi.number().min(0).max(100).default(10),
  TRIGGER_CUADRE_T2_2TANDAS: Joi.number().min(0).max(100).default(20),

  // Tiempos
  TIEMPO_AUTO_TRANSITO_HORAS: Joi.number().default(2),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info'),
  LOG_FORMAT: Joi.string().valid('json', 'pretty').default('json'),

  // Health Check
  HEALTH_CHECK_ENABLED: Joi.boolean().default(true),

  // Outbox Processor
  OUTBOX_POLL_INTERVAL: Joi.number().default(5000),
  OUTBOX_MAX_RETRIES: Joi.number().default(3),
});
