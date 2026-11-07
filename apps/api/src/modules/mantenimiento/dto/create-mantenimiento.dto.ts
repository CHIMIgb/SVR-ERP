import { IsString, IsIn, IsNumber, IsDateString, Min, Max, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { recortar } from '../../../common/validacion';

/** Topes de las columnas de `registros_mantenimiento` (Decimal(10,2) y Decimal(12,2)). */
export const HORAS_MANTENIMIENTO_MAX = 99_999_999.99;
export const COSTO_MANTENIMIENTO_MAX = 9_999_999_999.99;
export const DESCRIPCION_MANTENIMIENTO_MAX = 500;

export class CreateMantenimientoDto {
  /** Código legible de la máquina (ej. "M001"), no el UUID interno. */
  @Transform(recortar)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  maquinaId!: string;

  @IsIn(['Correctivo', 'Preventivo'])
  tipo!: 'Correctivo' | 'Preventivo';

  @Transform(recortar)
  @IsString()
  @MinLength(3)
  @MaxLength(DESCRIPCION_MANTENIMIENTO_MAX)
  descripcion!: string;

  @IsDateString()
  fecha!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(HORAS_MANTENIMIENTO_MAX)
  horasServicio!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(COSTO_MANTENIMIENTO_MAX)
  costo!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(HORAS_MANTENIMIENTO_MAX)
  proximoServicioHoras!: number;
}
