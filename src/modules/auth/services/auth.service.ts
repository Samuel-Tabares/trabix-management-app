import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@/infrastructure';
import { TokenBlacklistService } from '@/modules';
import { LoginDto, ChangePasswordDto, AuthResponseDto, UserResponseDto } from '../dto';
import { Usuario, Rol } from '@prisma/client';

/**
 * Payload del Access Token
 * Según sección 22.2 del documento
 */
export interface AccessTokenPayload {
  sub: string; // User ID
  email: string;
  rol: Rol;
  jti: string; // Token ID único para blacklist
}

/**
 * Payload del Refresh Token
 * Según sección 22.2 del documento
 */
export interface RefreshTokenPayload {
  sub: string; // User ID
  tokenId: string; // UUID único
}

/**
 * Payload decodificado (incluye campos automáticos de JWT)
 */
export interface DecodedToken {
  sub: string;
  email?: string;
  rol?: Rol;
  jti?: string;
  tokenId?: string;
  iat: number;
  exp: number;
}

/**
 * Servicio de autenticación
 * Según secciones 22.1, 22.2 del documento
 * 
 * - JWT Access Token: 15 minutos
 * - JWT Refresh Token: 7 días
 * - bcrypt: 12 rounds
 * - Bloqueo después de 5 intentos fallidos
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 15; // Según sección 22.1

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  /**
   * Inicia sesión de un usuario
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Buscar usuario por email
    const user = await this.prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar si está eliminado
    if (user.eliminado) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Verificar si está inactivo
    if (user.estado === 'INACTIVO') {
      throw new ForbiddenException('Usuario inactivo. Contacte al administrador.');
    }

    // Verificar si está bloqueado
    if (user.bloqueadoHasta && user.bloqueadoHasta > new Date()) {
      const minutosRestantes = Math.ceil(
        (user.bloqueadoHasta.getTime() - Date.now()) / (1000 * 60),
      );
      throw new ForbiddenException(
        `Cuenta bloqueada. Intente nuevamente en ${minutosRestantes} minutos.`,
      );
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      await this.handleFailedLogin(user);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Login exitoso: resetear intentos fallidos
    await this.prisma.usuario.update({
      where: { id: user.id },
      data: {
        intentosFallidos: 0,
        bloqueadoHasta: null,
        ultimoLogin: new Date(),
      },
    });

    // Generar tokens
    return this.generateAuthResponse(user);
  }

  /**
   * Renueva el access token usando un refresh token
   * Según sección 22.1: Valida token y hash en BD, rotación de tokens
   */
  async refreshTokens(refreshToken: string | undefined): Promise<AuthResponseDto> {
    try {
      // Verificar refresh token
        const payload = this.jwtService.verify<RefreshTokenPayload & { exp: number }>(
            refreshToken!,
            {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            },
        );

        // Verificar que tenga tokenId (estructura de refresh token)
      if (!payload.tokenId) {
        throw new UnauthorizedException('Token inválido');
      }

      // Verificar si está en blacklist
      const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(payload.tokenId);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token revocado');
      }

      // Buscar usuario y validar hash en BD (sección 22.1)
      const user = await this.prisma.usuario.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.eliminado || user.estado === 'INACTIVO') {
        throw new UnauthorizedException('Usuario no válido');
      }

      // Validar hash del refresh token en BD
      if (!user.refreshTokenHash) {
        throw new UnauthorizedException('Sesión inválida');
      }

        const isRefreshTokenValid = await bcrypt.compare(
            refreshToken!,
            user.refreshTokenHash,
        );
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Token inválido');
      }

      // Invalidar el refresh token actual (rotación de tokens)
      const exp = payload.exp || Math.floor(Date.now() / 1000) + 604800; // 7 días por defecto
      await this.tokenBlacklistService.addToBlacklist(payload.tokenId, exp);

      // Generar nuevos tokens
      return this.generateAuthResponse(user);
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Error al refrescar token', error);
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  /**
   * Cierra la sesión del usuario (invalida tokens)
   * Según sección 22.1: Elimina hash de BD y agrega token a blacklist
   */
  async logout(userId: string, accessToken: string, refreshToken?: string): Promise<void> {
    try {
      // 1. Eliminar hash del refresh token de la BD (sección 22.1)
      await this.prisma.usuario.update({
        where: { id: userId },
        data: { refreshTokenHash: null },
      });

      // 2. Invalidar access token agregándolo a blacklist
      const accessPayload = this.jwtService.decode(accessToken);
      if (accessPayload?.jti && accessPayload?.exp) {
        await this.tokenBlacklistService.addToBlacklist(
          accessPayload.jti,
          accessPayload.exp,
        );
      }

      // 3. Invalidar refresh token si se proporciona
      if (refreshToken) {
        const refreshPayload = this.jwtService.decode(refreshToken);
        if (refreshPayload?.tokenId && refreshPayload?.exp) {
          await this.tokenBlacklistService.addToBlacklist(
            refreshPayload.tokenId,
            refreshPayload.exp,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error al invalidar tokens', error);
      // No lanzar error, el logout debe ser silencioso
    }
  }

  /**
   * Cambia la contraseña del usuario
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // Verificar que la nueva contraseña sea diferente
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');
    }

    // Hash de la nueva contraseña
    const bcryptRounds = this.configService.get<number>('security.bcryptRounds', 12);
    const newPasswordHash = await bcrypt.hash(newPassword, bcryptRounds);

    // Actualizar contraseña
    await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        requiereCambioPassword: false,
      },
    });

    this.logger.log(`Usuario ${userId} cambió su contraseña`);
  }

  /**
   * Valida un usuario por ID (usado por JWT Strategy)
   */
  async validateUserById(userId: string): Promise<Usuario | null> {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user || user.eliminado || user.estado === 'INACTIVO') {
      return null;
    }

    return user;
  }

  /**
   * Verifica si un token está en blacklist
   */
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    return this.tokenBlacklistService.isBlacklisted(jti);
  }

  /**
   * Hash de contraseña (usado para crear usuarios)
   */
  async hashPassword(password: string): Promise<string> {
    const bcryptRounds = this.configService.get<number>('security.bcryptRounds', 12);
    return bcrypt.hash(password, bcryptRounds);
  }

  /**
   * Maneja un intento de login fallido
   */
  private async handleFailedLogin(user: Usuario): Promise<void> {
    const newAttempts = user.intentosFallidos + 1;

    const updateData: { intentosFallidos: number; bloqueadoHasta?: Date } = {
      intentosFallidos: newAttempts,
    };

    // Bloquear si excede el máximo de intentos
    if (newAttempts >= this.MAX_FAILED_ATTEMPTS) {
      updateData.bloqueadoHasta = new Date(
        Date.now() + this.LOCKOUT_DURATION_MINUTES * 60 * 1000,
      );
      this.logger.warn(`Usuario ${user.email} bloqueado por ${this.LOCKOUT_DURATION_MINUTES} minutos`);
    }

    await this.prisma.usuario.update({
      where: { id: user.id },
      data: updateData,
    });
  }

  /**
   * Genera la respuesta de autenticación con tokens
   * Según sección 22.2 del documento
   */
  private async generateAuthResponse(user: Usuario): Promise<AuthResponseDto> {
    const accessTokenId = uuidv4();
    const refreshTokenId = uuidv4();

    // Payload del access token (sección 22.2)
    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      jti: accessTokenId,
    };

    // Payload del refresh token (sección 22.2)
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      tokenId: refreshTokenId,
    };

    // Generar tokens
    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiration', '15m'),
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiration', '7d'),
    });

    // Guardar hash del refresh token en BD (sección 22.1)
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.usuario.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    const userResponse: UserResponseDto = {
      id: user.id,
      nombre: user.nombre,
      apellidos: user.apellidos,
      email: user.email,
      rol: user.rol,
      requiereCambioPassword: user.requiereCambioPassword,
    };

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900, // 15 minutos en segundos
      user: userResponse,
    };
  }
}
