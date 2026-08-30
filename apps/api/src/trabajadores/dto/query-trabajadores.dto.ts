import { IsIn, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CATEGORIAS_PUESTO } from './create-trabajador.dto';
import { ESTADOS_TRABAJADOR } from './update-trabajador.dto';

export class QueryTrabajadoresDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(CATEGORIAS_PUESTO)
  categoriaPuesto?: (typeof CATEGORIAS_PUESTO)[number];

  @IsOptional()
  @IsIn(ESTADOS_TRABAJADOR)
  estado?: (typeof ESTADOS_TRABAJADOR)[number];

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}
