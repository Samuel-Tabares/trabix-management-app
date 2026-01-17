import { SetMetadata } from '@nestjs/common';
import { IDEMPOTENT_KEY } from '../interceptors/idempotency.interceptor';

/**
 * Decorador para marcar endpoints que requieren idempotencia
 * 
 * Los endpoints marcados con @Idempotent() verificarán el header
 * X-Idempotency-Key y cachearán la respuesta por 24 horas
 * 
 * @example
 * @Idempotent()
 * @Post('ventas')
 * createVenta(@Body() dto: CreateVentaDto) { ... }
 */
export const Idempotent = () => SetMetadata(IDEMPOTENT_KEY, true);
