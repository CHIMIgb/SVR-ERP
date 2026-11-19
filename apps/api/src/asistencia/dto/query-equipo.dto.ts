import { IsDateString, IsOptional } from 'class-validator';

export class QueryEquipoDto {
  /** Día a consultar (YYYY-MM-DD); por defecto hoy. */
  @IsOptional()
  @IsDateString()
  fecha?: string;
}
