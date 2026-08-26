import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class QuerySemanalDto {
  /** Cualquier fecha dentro de la semana (Lun-Sáb) a consultar; por defecto hoy. */
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsUUID()
  trabajadorId?: string;
}
