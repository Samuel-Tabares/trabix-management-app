import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsUUID,
} from 'class-validator';

/**
 * DTO para crear un nuevo usuario/vendedor
 * Según sección 1.2 del documento
 * 
 * Datos requeridos:
 * - Cédula
 * - Nombre y apellidos
 * - Número de teléfono
 * - Correo electrónico
 * - Reclutador (opcional, si no se especifica es Admin)
 */
export class CreateUsuarioDto {
  @ApiProperty({
    description: 'Cédula del usuario (única)',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty({ message: 'La cédula es requerida' })
  @MinLength(6, { message: 'La cédula debe tener al menos 6 caracteres' })
  @MaxLength(15, { message: 'La cédula no puede exceder 15 caracteres' })
  @Matches(/^[0-9]+$/, { message: 'La cédula solo puede contener números' })
  cedula!: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  nombre!: string;

  @ApiProperty({
    description: 'Apellidos del usuario',
    example: 'Pérez García',
  })
  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son requeridos' })
  @MinLength(2, { message: 'Los apellidos deben tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'Los apellidos no pueden exceder 100 caracteres' })
  apellidos!: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario (único)',
    example: 'juan.perez@email.com',
  })
  @IsEmail({}, { message: 'Debe ser un correo electrónico válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email!: string;

  @ApiProperty({
    description: 'Número de teléfono del usuario (único)',
    example: '3001234567',
  })
  @IsString()
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  @MinLength(7, { message: 'El teléfono debe tener al menos 7 caracteres' })
  @MaxLength(15, { message: 'El teléfono no puede exceder 15 caracteres' })
  @Matches(/^[0-9+\-\s]+$/, {
    message: 'El teléfono solo puede contener números, +, - y espacios',
  })
  telefono!: string;

  @ApiPropertyOptional({
    description: 'ID del usuario reclutador. Si no se especifica, el Admin es el reclutador directo.',
    example: 'uuid-del-reclutador',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del reclutador debe ser un UUID válido' })
  reclutadorId?: string;
}
