import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/**
 * Movimiento bancario: exactamente uno de `deposito`/`retiro` es obligatorio
 * (validado en el servicio — `IsOptional` ambos para permitir el error con
 * audit FAIL en lugar de rechazo 400 genérico del ValidationPipe).
 */
export class CreateMovimientoDto {
  @IsDateString()
  fecha!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  descripcion!: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  deposito?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  retiro?: number;
}