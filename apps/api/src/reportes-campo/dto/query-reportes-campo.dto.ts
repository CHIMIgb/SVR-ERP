import { IsEnum, IsIn, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  EstadoReporteCampo,
  Prioridad,
  TipoReporteCampo,
} from '@prisma/client';

export class QueryReportesCampoDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(EstadoReporteCampo)
  estado?: EstadoReporteCampo;

  @IsOptional()
  @IsEnum(TipoReporteCampo)
  tipo?: TipoReporteCampo;

  @IsOptional()
  @IsEnum(Prioridad)
  prioridad?: Prioridad;

  /** Banner de críticos: INCIDENTE con prioridad Alta/Crítica sin resolver. */
  @IsOptional()
  @IsIn(['true'])
  criticos?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}
