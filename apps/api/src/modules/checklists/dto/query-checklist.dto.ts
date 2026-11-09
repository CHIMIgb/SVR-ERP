import { IsIn, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryChecklistDto {
  /** Código legible de la máquina (ej. "M001"). */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  maquinaId?: string;

  @IsOptional()
  @IsIn(['Aprobado', 'Con Falla'])
  estado?: 'Aprobado' | 'Con Falla';

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}
