import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { CATEGORIAS_PROVEEDOR } from './create-proveedor.dto';

export class QueryProveedoresDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(CATEGORIAS_PROVEEDOR)
  categoria?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}