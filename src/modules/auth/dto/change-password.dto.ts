import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para cambio de contraseña
 * Según sección 20.2 del documento
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Contraseña actual del usuario',
    example: 'MiPasswordActual123!',
  })
  @IsString({ message: 'La contraseña actual debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  currentPassword!: string;

  @ApiProperty({
    description: 'Nueva contraseña (mínimo 8 caracteres, debe incluir mayúscula, minúscula, número y caracter especial)',
    example: 'MiNuevaPassword123!',
    minLength: 8,
  })
  @IsString({ message: 'La nueva contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.$!%*?&])[A-Za-z\d@.$!%*?&]+$/,
    {
      message:
        'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un caracter especial (@.$!%*?&)',
    },
  )
  newPassword!: string;
}
