import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { EstadoUsuario } from '@prisma/client';

/**
 * DTO para cambiar el estado de un usuario
 * Según sección 1.2: ACTIVO/INACTIVO
 */
export class CambiarEstadoDto {
  @ApiProperty({
    description: 'Nuevo estado del usuario',
    enum: ['ACTIVO', 'INACTIVO'],
    example: 'INACTIVO',
  })
  @IsNotEmpty({ message: 'El estado es requerido' })
  @IsEnum(['ACTIVO', 'INACTIVO'], {
    message: 'El estado debe ser ACTIVO o INACTIVO',
  })
  estado!: EstadoUsuario;
}
