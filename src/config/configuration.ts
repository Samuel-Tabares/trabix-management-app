export default () => ({
  // Aplicación
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || 'api/v1',
  },

  // Base de datos
  database: {
    url: process.env.DATABASE_URL,
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    url: process.env.REDIS_URL,
  },

  // Queue (Bull)
  queue: {
    redisUrl: process.env.BULL_REDIS_URL || process.env.REDIS_URL,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },

  // Seguridad
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  },

  // Negocio - Precios
  business: {
    costoPercibidoTrabix: parseInt(process.env.COSTO_PERCIBIDO_TRABIX || '2400', 10),
    aporteFondoPorTrabix: parseInt(process.env.APORTE_FONDO_POR_TRABIX || '200', 10),
    precioUnidadLicor: parseInt(process.env.PRECIO_UNIDAD_LICOR || '8000', 10),
    precioPromoLicor: parseInt(process.env.PRECIO_PROMO_LICOR || '12000', 10),
    precioUnidadSinLicor: parseInt(process.env.PRECIO_UNIDAD_SIN_LICOR || '7000', 10),
    // Precios al mayor
    precioMayor20Licor: parseInt(process.env.PRECIO_MAYOR_20_LICOR || '4900', 10),
    precioMayor50Licor: parseInt(process.env.PRECIO_MAYOR_50_LICOR || '4700', 10),
    precioMayor100Licor: parseInt(process.env.PRECIO_MAYOR_100_LICOR || '4500', 10),
    precioMayor20SinLicor: parseInt(process.env.PRECIO_MAYOR_20_SIN_LICOR || '4800', 10),
    precioMayor50SinLicor: parseInt(process.env.PRECIO_MAYOR_50_SIN_LICOR || '4500', 10),
    precioMayor100SinLicor: parseInt(process.env.PRECIO_MAYOR_100_SIN_LICOR || '4200', 10),
  },

  // Equipamiento
  equipamiento: {
    mensualidadConDeposito: parseInt(process.env.MENSUALIDAD_CON_DEPOSITO || '9990', 10),
    mensualidadSinDeposito: parseInt(process.env.MENSUALIDAD_SIN_DEPOSITO || '19990', 10),
    deposito: parseInt(process.env.DEPOSITO_EQUIPAMIENTO || '49990', 10),
    costoDanoNevera: parseInt(process.env.COSTO_DANO_NEVERA || '30000', 10),
    costoDanoPijama: parseInt(process.env.COSTO_DANO_PIJAMA || '60000', 10),
  },

  // Porcentajes
  porcentajes: {
    vendedor6040: parseInt(process.env.PORCENTAJE_VENDEDOR_60_40 || '60', 10),
    admin6040: parseInt(process.env.PORCENTAJE_ADMIN_60_40 || '40', 10),
    vendedor5050: parseInt(process.env.PORCENTAJE_VENDEDOR_50_50 || '50', 10),
    inversion: parseInt(process.env.PORCENTAJE_INVERSION || '50', 10),
    limiteRegalos: parseInt(process.env.LIMITE_REGALOS || '8', 10),
    triggerCuadreT2: parseInt(process.env.TRIGGER_CUADRE_T2 || '10', 10),
    triggerCuadreT3: parseInt(process.env.TRIGGER_CUADRE_T3 || '20', 10),
    triggerCuadreT1_2Tandas: parseInt(process.env.TRIGGER_CUADRE_T1_2TANDAS || '10', 10),
    triggerCuadreT2_2Tandas: parseInt(process.env.TRIGGER_CUADRE_T2_2TANDAS || '20', 10),
  },

  // Tiempos
  tiempos: {
    autoTransitoHoras: parseInt(process.env.TIEMPO_AUTO_TRANSITO_HORAS || '2', 10),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  // Health Check
  healthCheck: {
    enabled: process.env.HEALTH_CHECK_ENABLED === 'true',
  },

  // Outbox Processor
  outbox: {
    pollInterval: parseInt(process.env.OUTBOX_POLL_INTERVAL || '5000', 10),
    maxRetries: parseInt(process.env.OUTBOX_MAX_RETRIES || '3', 10),
  },
});
