import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

/**
 * DTO para confirmar un cuadre como exitoso
 * Según sección 17.6: monto_recibido >= monto_esperado
 */
export class ConfirmarCuadreDto {
  @ApiProperty({
    description: 'Monto recibido por transferencia',
    example: 120000,
    minimum: 0,
  })
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @Min(0, { message: 'El monto no puede ser negativo' })
  montoRecibido!: number;
}
