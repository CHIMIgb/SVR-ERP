import { IsBoolean, IsIn, IsNumber, IsOptional, Matches, Max, MaxLength, Min, MinLength, IsString } from 'class-validator';
import { TIPOS_GEOCERCA, type TipoGeocerca } from './create-geocerca.dto';

export class UpdateGeocercaDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombre?: string;

  @IsOptional()
  @IsIn(TIPOS_GEOCERCA)
  tipo?: TipoGeocerca;

  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'color debe ser un hex de 6 dígitos (ej. #3b82f6)' })
  color?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-90)
  @Max(90)
  centroLat?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-180)
  @Max(180)
  centroLng?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(10)
  @Max(50000)
  radioMetros?: number;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
