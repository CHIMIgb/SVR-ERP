import { IsDateString, IsOptional } from 'class-validator';

export class QueryPeriodoDto {
  /** Cualquier fecha dentro de la semana (Lun-Sáb) del periodo a consultar; por defecto hoy. */
  @IsOptional()
  @IsDateString()
  fecha?: string;
}
