import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para login
 * Según sección 20.2 del documento
 */
export class LoginDto {
    @ApiProperty({
        description: 'Cédula del usuario',
        example: 'ADMIN001',
    })
    @IsString({ message: 'La cédula debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'La cédula es requerida' })
    cedula!: string;

    @ApiProperty({
        description: 'Contraseña del usuario',
        example: 'MiPassword123!',
        minLength: 8,
    })
    @IsString({ message: 'La contraseña debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'La contraseña es requerida' })
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    password!: string;
}