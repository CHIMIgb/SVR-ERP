import { IsString, IsIn, IsNumber, IsOptional, IsDateString, Min, Max, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { recortar } from '../../../common/validacion';
import { COSTO_MANTENIMIENTO_MAX, DESCRIPCION_MANTENIMIENTO_MAX, HORAS_MANTENIMIENTO_MAX } from './create-mantenimiento.dto';

export class UpdateMantenimientoDto {
  @IsOptional()
  @Transform(recortar)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  maquinaId?: string;

  @IsOptional()
  @IsIn(['Correctivo', 'Preventivo'])
  tipo?: 'Correctivo' | 'Preventivo';

  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MinLength(3)
  @MaxLength(DESCRIPCION_MANTENIMIENTO_MAX)
  descripcion?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(HORAS_MANTENIMIENTO_MAX)
  horasServicio?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(COSTO_MANTENIMIENTO_MAX)
  costo?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(HORAS_MANTENIMIENTO_MAX)
  proximoServicioHoras?: number;
}
