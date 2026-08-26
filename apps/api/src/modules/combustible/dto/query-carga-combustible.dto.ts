import { IsBooleanString, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryCargaCombustibleDto {
  @IsOptional()
  @IsString()
  search?: string;

  /** Código legible de la máquina (ej. "M001"). */
  @IsOptional()
  @IsString()
  maquinaId?: string;

  @IsOptional()
  @IsBooleanString()
  soloAlertas?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}
