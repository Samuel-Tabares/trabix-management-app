import { registerAs } from '@nestjs/config';

export default registerAs('throttle', () => ({
  // Global: 100 requests / minuto / IP
  global: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10) * 1000, // convertir a ms
    limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  // Login: 5 requests / minuto / IP
  login: {
    ttl: 60 * 1000,
    limit: 5,
  },
  // Endpoints sensibles: 20 requests / minuto / IP
  sensitive: {
    ttl: 60 * 1000,
    limit: 20,
  },
  // WebSocket: 10 conexiones / minuto / usuario
  websocket: {
    ttl: 60 * 1000,
    limit: 10,
  },
}));
