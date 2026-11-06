import { IsString, IsNumber, IsOptional, IsDateString, Min, Max, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { recortar } from '../../../common/validacion';
import { COSTO_CARGA_MAX, HORAS_PERIODO_MAX, LITROS_MAX, LUGAR_MAX, OPERADOR_MAX } from './create-carga-combustible.dto';

export class UpdateCargaCombustibleDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  @Max(LITROS_MAX)
  litros?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(HORAS_PERIODO_MAX)
  horasTrabajadasPeriodo?: number;

  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MinLength(3)
  @MaxLength(LUGAR_MAX)
  lugar?: string;

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
