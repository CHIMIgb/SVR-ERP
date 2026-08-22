import {
  IsOptional,
  IsString,
  IsUUID,
  IsIn,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryArticulosDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @IsOptional()
  @IsUUID()
  proveedorId?: string;

  @IsOptional()
  @IsIn(['bajo', 'ok'])
  stockEstado?: 'bajo' | 'ok';

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}
