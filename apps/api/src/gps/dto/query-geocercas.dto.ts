import { IsBooleanString, IsIn, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TIPOS_GEOCERCA, type TipoGeocerca } from './create-geocerca.dto';

export class QueryGeocercasDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(TIPOS_GEOCERCA)
  tipo?: TipoGeocerca;

  /** "true" | "false" — filtra por geocercas activas/inactivas. */
  @IsOptional()
  @IsBooleanString()
  activa?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}
