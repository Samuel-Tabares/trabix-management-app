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
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { LoginDto, ChangePasswordDto, AuthResponseDto, UserResponseDto } from '../dto';
import { Usuario, Rol } from '@prisma/client';

/**
 * Payload del Access Token
 */
export interface AccessTokenPayload {
    sub: string;
    rol: Rol;
    jti: string;
}

/**
 * Payload del Refresh Token
 */
export interface RefreshTokenPayload {
    sub: string;
    tokenId: string;
}

/**
 * Servicio de autenticación
 */
@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly MAX_FAILED_ATTEMPTS = 5;
    private readonly LOCKOUT_DURATION_MINUTES = 15;

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly tokenBlacklistService: TokenBlacklistService,
    ) {}

    /**
     * LOGIN
     */
    async login(loginDto: LoginDto): Promise<AuthResponseDto> {
        const { cedula, password } = loginDto;

        if (!cedula || !password) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const user = await this.prisma.usuario.findUnique({
            where: { cedula },
        });

        if (!user || user.eliminado) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        if (user.estado === 'INACTIVO') {
            throw new ForbiddenException('Usuario inactivo');
        }

        if (user.bloqueadoHasta && user.bloqueadoHasta > new Date()) {
            throw new ForbiddenException('Cuenta bloqueada temporalmente');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            await this.handleFailedLogin(user);
            throw new UnauthorizedException('Credenciales inválidas');
        }

        await this.prisma.usuario.update({
            where: { id: user.id },
            data: {
                intentosFallidos: 0,
                bloqueadoHasta: null,
                ultimoLogin: new Date(),
            },
        });

        return this.generateAuthResponse(user);
    }

    /**
     * REFRESH TOKEN
     */
    async refreshTokens(refreshToken?: string): Promise<AuthResponseDto> {
        if (!refreshToken) {
            throw new UnauthorizedException('Token inválido');
        }

        let payload: RefreshTokenPayload & { exp: number };
        try {
            payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('jwt.refreshSecret'),
            });
        } catch {
            throw new UnauthorizedException('Token inválido');
        }

        if (!payload.tokenId) {
            throw new UnauthorizedException('Token inválido');
        }

        const blacklisted = await this.tokenBlacklistService.isBlacklisted(payload.tokenId);
        if (blacklisted) {
            throw new UnauthorizedException('Token revocado');
        }

        const user = await this.prisma.usuario.findUnique({
            where: { id: payload.sub },
        });

        if (!user || user.eliminado || user.estado === 'INACTIVO') {
            throw new UnauthorizedException('Usuario no válido');
        }

        if (!user.refreshTokenHash) {
            throw new UnauthorizedException('Sesión inválida');
        }

        const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
        if (!valid) {
            throw new UnauthorizedException('Token inválido');
        }

        await this.tokenBlacklistService.addToBlacklist(payload.tokenId, payload.exp);

        return this.generateAuthResponse(user);
    }

    /**
     * LOGOUT
     */
    async logout(userId: string, accessToken: string): Promise<void> {
        try {
            await this.prisma.usuario.update({
                where: { id: userId },
                data: { refreshTokenHash: null },
            });

            const decoded: any = this.jwtService.decode(accessToken);
            if (decoded?.jti && decoded?.exp) {
                await this.tokenBlacklistService.addToBlacklist(decoded.jti, decoded.exp);
            }
        } catch (e) {
            this.logger.error('Error en logout', e);
        }
    }

    /**
     * CHANGE PASSWORD
     */
    async changePassword(
        userId: string,
        dto: ChangePasswordDto,
    ): Promise<void> {
        const user = await this.prisma.usuario.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new UnauthorizedException();
        }

        const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!valid) {
            throw new BadRequestException('Contraseña incorrecta');
        }

        const hash = await bcrypt.hash(
            dto.newPassword,
            this.configService.get<number>('security.bcryptRounds', 12),
        );

        await this.prisma.usuario.update({
            where: { id: userId },
            data: {
                passwordHash: hash,
                requiereCambioPassword: false,
            },
        });
    }

    async validateUserById(userId: string): Promise<Usuario | null> {
        const user = await this.prisma.usuario.findUnique({
            where: { id: userId },
        });

        if (!user || user.eliminado || user.estado === 'INACTIVO') {
            return null;
        }

        return user;
    }

    async isTokenBlacklisted(jti: string): Promise<boolean> {
        return this.tokenBlacklistService.isBlacklisted(jti);
    }

    private async handleFailedLogin(user: Usuario): Promise<void> {
        const attempts = user.intentosFallidos + 1;

        const data: any = { intentosFallidos: attempts };

        if (attempts >= this.MAX_FAILED_ATTEMPTS) {
            data.bloqueadoHasta = new Date(
                Date.now() + this.LOCKOUT_DURATION_MINUTES * 60 * 1000,
            );
        }

        await this.prisma.usuario.update({
            where: { id: user.id },
            data,
        });
    }

    private async generateAuthResponse(user: Usuario): Promise<AuthResponseDto> {
        const accessJti = uuidv4();
        const refreshJti = uuidv4();

        const accessToken = this.jwtService.sign(
            {
                sub: user.id,
                rol: user.rol,
                jti: accessJti,
            },
            {
                secret: this.configService.get<string>('jwt.secret'),
                expiresIn: this.configService.get<string>('jwt.accessExpiration', '15m'),
            },
        );

        const refreshToken = this.jwtService.sign(
            {
                sub: user.id,
                tokenId: refreshJti,
            },
            {
                secret: this.configService.get<string>('jwt.refreshSecret'),
                expiresIn: this.configService.get<string>('jwt.refreshExpiration', '7d'),
            },
        );

        await this.prisma.usuario.update({
            where: { id: user.id },
            data: {
                refreshTokenHash: await bcrypt.hash(refreshToken, 10),
            },
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
            expiresIn: 900,
            user: userResponse,
        };
    }
}
