import { IsNumber, IsString, MaxLength, Min } from 'class-validator';

/**
 * Un renglón de cotización (partida). El `importe` NO se acepta del cliente:
 * el service lo calcula como cantidad × precioUnitario y con la suma de
 * importes recalcula el `monto` de la cabecera.
 */
export class CotizacionItemDto {
  @IsString()
  @MaxLength(300)
  descripcion!: string;

  @IsNumber()
  @Min(0.0001)
  cantidad!: number;

  @IsString()
  @MaxLength(30)
  unidad!: string;

  @IsNumber()
  @Min(0)
  precioUnitario!: number;
}
