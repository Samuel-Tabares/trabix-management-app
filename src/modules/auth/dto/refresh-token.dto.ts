import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para refresh token
 * Según sección 20.2 del documento
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token para obtener nuevo access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: 'El refresh token debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El refresh token es requerido' })
  refreshToken!: string;
}
