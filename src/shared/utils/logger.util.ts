import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || 'info';
const logFormat = process.env.LOG_FORMAT || 'json';

// Formato para producción (JSON)
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Formato para desarrollo (Pretty print)
const prettyFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.ms(),
  nestWinstonModuleUtilities.format.nestLike('TRABIX', {
    colors: true,
    prettyPrint: true,
  }),
);

export const winstonConfig = {
  transports: [
    new winston.transports.Console({
      level: logLevel,
      format: logFormat === 'json' || isProduction ? jsonFormat : prettyFormat,
    }),
  ],
};

export const WinstonLoggerModule = WinstonModule.forRoot(winstonConfig);

// Factory para crear el logger en bootstrap
export const createWinstonLogger = () => {
  return WinstonModule.createLogger(winstonConfig);
};
