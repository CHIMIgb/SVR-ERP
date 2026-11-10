import { IsString, IsNumber, IsOptional, IsDateString, Min, Max, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { recortar } from '../../../common/validacion';

/** Topes de las columnas de `cargas_combustible` (Decimal(10,2), Decimal(12,2) y Decimal(6,2)). */
export const LITROS_MAX = 99_999_999.99;
export const COSTO_CARGA_MAX = 9_999_999_999.99;
export const HORAS_PERIODO_MAX = 9_999.99;
export const LUGAR_MAX = 200;
export const OPERADOR_MAX = 150;

export class CreateCargaCombustibleDto {
  /** Código legible de la máquina (ej. "M001"), no el UUID interno. */
  @Transform(recortar)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  maquinaId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  @Max(LITROS_MAX)
  litros!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(HORAS_PERIODO_MAX)
  horasTrabajadasPeriodo!: number;

  @Transform(recortar)
  @IsString()
  @MinLength(3)
  @MaxLength(LUGAR_MAX)
  lugar!: string;

  /**
   * Opcional por compatibilidad con otros clientes: si falta, el servicio usa un precio de referencia fijo.
   * La vista web lo pide siempre para no guardar un costo estimado como si fuera real.
   */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(COSTO_CARGA_MAX)
  costo?: number;

  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(OPERADOR_MAX)
  operador?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;
}
