import { IsDateString, IsEnum, IsIn, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Turno } from '@prisma/client';
import { MATERIALES_CRIBA } from './create-registro-criba.dto';

export class QueryRegistrosCribaDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(Turno)
  turno?: Turno;

  @IsOptional()
  @IsIn(MATERIALES_CRIBA)
  tipoMaterial?: string;

  /** B6: filtro por máquina que produjo. */
  @IsOptional()
  @IsUUID()
  maquinaId?: string;

  /** B6: filtro por proyecto de destino. */
  @IsOptional()
  @IsUUID()
  proyectoId?: string;

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
