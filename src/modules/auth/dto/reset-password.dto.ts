import { ApiProperty } from '@nestjs/swagger';
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
