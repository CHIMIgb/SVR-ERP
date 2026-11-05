import { IsDateString, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryHistorialDto {
  /** Fecha (YYYY-MM-DD). Por defecto, el día de hoy. */
  @IsOptional()
  @IsDateString()
  fecha?: string;

  /** Máximo de puntos a devolver (el recorrido de un día puede ser largo). */
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(500)
  limit?: number;
}
