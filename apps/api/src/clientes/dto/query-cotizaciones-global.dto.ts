import { IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoCotizacion } from '@prisma/client';

/**
 * Query del listado GLOBAL de cotizaciones (vista /cotizaciones).
 * No incluye `clienteId` como path param: acá se filtra globalmente.
 */
export class QueryCotizacionesGlobalDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(EstadoCotizacion)
  estado?: EstadoCotizacion;

  @IsOptional()
  @IsString()
  clienteId?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}
