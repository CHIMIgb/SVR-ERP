import { IsIn, IsOptional, IsString, IsUUID, IsDateString, IsBooleanString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export const ESTADOS_ASISTENCIA = ['Puntual', 'Retardo', 'Falta', 'Justificado', 'No Presentado', 'Salida Anticipada'] as const;

export class QueryAsistenciaDto {
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsUUID()
  trabajadorId?: string;

  @IsOptional()
  @IsUUID()
  obraId?: string;

  @IsOptional()
  @IsIn(ESTADOS_ASISTENCIA)
  estado?: (typeof ESTADOS_ASISTENCIA)[number];

  @IsOptional()
  @IsBooleanString()
  enSitio?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}
