import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, AccessTokenPayload } from '../services/auth.service';

/**
 * JWT Strategy para Passport
 * Según sección 22.1 del documento
 * 
 * Extrae el token del header Authorization: Bearer <token>
 * Valida el token y verifica que no esté en blacklist
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
      configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
      passReqToCallback: true,
    });
  }

  /**
   * Valida el payload del JWT
   * Se ejecuta después de que Passport verifica la firma y expiración
   */
  async validate(payload: AccessTokenPayload) {
    // Verificar que tenga la estructura de access token (jti)
    if (!payload.jti) {
      throw new UnauthorizedException('Token inválido');
    }

    // Verificar si el token está en blacklist
    const isBlacklisted = await this.authService.isTokenBlacklisted(payload.jti);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token revocado');
    }

    // Validar que el usuario existe y está activo
    const user = await this.authService.validateUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Usuario no válido');
    }

    // Retornar el usuario para que esté disponible en request.user
    return {
      id: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre,
      apellidos: user.apellidos,
      requiereCambioPassword: user.requiereCambioPassword,
      jti: payload.jti,
    };
  }
}
