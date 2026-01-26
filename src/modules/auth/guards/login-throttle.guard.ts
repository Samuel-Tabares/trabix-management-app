import {
    Injectable,
    ExecutionContext,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { ThrottlerGuard, ThrottlerStorage } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

/**
 * Guard de rate limiting personalizado para el endpoint de login
 * Lee la configuración desde las variables de entorno via ConfigService
 *
 * Usa THROTTLE_LOGIN_TTL y THROTTLE_LOGIN_LIMIT del .env
 */
@Injectable()
export class LoginThrottleGuard extends ThrottlerGuard {
    private readonly loginTtl: number;
    private readonly loginLimit: number;

    constructor(
        storageService: ThrottlerStorage,
        configService: ConfigService,
        reflector: Reflector,
    ) {
        const ttl = configService.get<number>('throttle.login.ttl', 60000);
        const limit = configService.get<number>('throttle.login.limit', 5);

        super(
            {
                throttlers: [
                    {
                        name: 'login',
                        ttl,
                        limit,
                    },
                ],
                errorMessage: 'Demasiados intentos de login. Intente más tarde.',
            },
            storageService,
            reflector,
        );

        this.loginTtl = ttl;
        this.loginLimit = limit;
    }

    /**
     * Genera la clave de tracking usando la IP del cliente
     */
    protected async getTracker(req: Record<string, any>): Promise<string> {
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        return `login_throttle:${ip}`;
    }

    /**
     * Maneja el caso cuando se excede el límite de requests
     */
    protected async throwThrottlingException(): Promise<void> {
        throw new HttpException(
            {
                statusCode: HttpStatus.TOO_MANY_REQUESTS,
                message: 'Demasiados intentos de login. Intente más tarde.',
                error: 'Too Many Requests',
            },
            HttpStatus.TOO_MANY_REQUESTS,
        );
    }

    /**
     * Override para usar nuestra configuración personalizada
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const tracker = await this.getTracker(request);

        const { totalHits, timeToExpire } = await this.storageService.increment(
            tracker,
            this.loginTtl,
            this.loginLimit,
            this.loginTtl,
            'login',
        );

        if (totalHits > this.loginLimit) {
            await this.throwThrottlingException();
        }

        // Agregar headers de rate limit a la respuesta
        const response = context.switchToHttp().getResponse();
        response.header('X-RateLimit-Limit', this.loginLimit);
        response.header(
            'X-RateLimit-Remaining',
            Math.max(0, this.loginLimit - totalHits),
        );
        response.header('X-RateLimit-Reset', Math.ceil(timeToExpire / 1000));

        return true;
    }
}