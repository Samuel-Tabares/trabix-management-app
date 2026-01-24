import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para que el admin resetee la contraseña de un usuario
 * Genera una contraseña temporal que el usuario deberá cambiar
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: 'ID del usuario al que se le reseteará la contraseña',
    example: 'uuid-v4-string',
  })
  @IsUUID('4', { message: 'El ID del usuario debe ser un UUID válido' })
  usuarioId!: string;
}

/**
 * DTO de respuesta al resetear contraseña
 */
export class ResetPasswordResponseDto {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Contraseña reseteada exitosamente',
  })
  message!: string;

  @ApiProperty({
    description: 'Contraseña temporal generada (compartir con el usuario de forma segura)',
    example: 'Tmp$Ax7k9',
  })
  passwordTemporal!: string;

  @ApiProperty({
    description: 'ID del usuario',
    example: 'uuid-v4-string',
  })
  usuarioId!: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
  })
  nombreUsuario!: string;
}
