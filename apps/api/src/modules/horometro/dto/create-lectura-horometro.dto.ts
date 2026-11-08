import { IsString, IsNumber, IsDateString, Min, Max, MaxLength, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
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

  /**
   * Confirma una lectura inicial que arranca muy arriba del horómetro de la máquina (la máquina trabajó sin lecturas
   * registradas). Sin esto, un salto así se rechaza: suele ser un error de captura y el horómetro no se regresa.
   */
  @IsOptional()
  @IsBoolean()
  confirmarSalto?: boolean;
}
