import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService, Public, JwtAuthGuard, CurrentUser, AuthenticatedUser, } from '@/modules';
import {
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  AuthResponseDto,
  MessageResponseDto,
} from './dto';

/**
 * Controlador de autenticación
 * Según sección 20.2 del documento
 * 
 * Endpoints:
 * - POST /login - Iniciar sesión
 * - POST /refresh - Renovar access token
 * - POST /logout - Cerrar sesión
 * - POST /cambiar-password - Cambiar contraseña
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   * Inicia sesión con email y contraseña
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto (sección 22.4)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiResponse({ status: 403, description: 'Usuario bloqueado o inactivo' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * POST /auth/refresh
   * Renueva el access token usando el refresh token
   */
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Tokens renovados exitosamente',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  /**
   * POST /auth/logout
   * Cierra la sesión del usuario (invalida tokens)
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          description: 'Refresh token a invalidar (opcional)',
        },
      },
    },
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión cerrada exitosamente',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('authorization') authHeader: string,
    @Body('refreshToken') refreshToken?: string,
  ): Promise<MessageResponseDto> {
    const accessToken = authHeader?.replace('Bearer ', '');
    await this.authService.logout(user.id, accessToken, refreshToken);
    return { message: 'Sesión cerrada exitosamente' };
  }

  /**
   * POST /auth/cambiar-password
   * Cambia la contraseña del usuario autenticado
   */
  @Post('cambiar-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cambiar contraseña' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Contraseña cambiada exitosamente',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Contraseña actual incorrecta' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<MessageResponseDto> {
    await this.authService.changePassword(user.id, changePasswordDto);
    return { message: 'Contraseña cambiada exitosamente' };
  }
}
