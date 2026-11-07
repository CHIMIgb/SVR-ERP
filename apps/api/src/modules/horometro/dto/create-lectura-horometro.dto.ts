import { IsString, IsNumber, IsDateString, Min, Max, MaxLength, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { recortar } from '../../../common/validacion';

/** Tope de la columna `lecturas_horometro.lectura_*` (Decimal(10,2)). */
export const LECTURA_HOROMETRO_MAX = 99_999_999.99;

export class CreateLecturaHorometroDto {
  /** Código legible de la máquina (ej. "M001"), no el UUID interno. */
  @Transform(recortar)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  maquinaId!: string;

  @IsDateString()
  fecha!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(LECTURA_HOROMETRO_MAX)
  lecturaInicial!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(LECTURA_HOROMETRO_MAX)
  lecturaFinal!: number;
}
