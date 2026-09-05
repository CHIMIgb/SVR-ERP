import { IsDateString, IsEnum, IsIn, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoTransaccion } from '@prisma/client';
import { CATEGORIAS_FINANZAS } from './create-transaccion.dto';

export class QueryTransaccionesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(TipoTransaccion)
  tipo?: TipoTransaccion;

  @IsOptional()
  @IsIn(CATEGORIAS_FINANZAS)
  categoria?: string;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}
