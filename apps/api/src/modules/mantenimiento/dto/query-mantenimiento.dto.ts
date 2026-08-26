import { IsIn, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryMantenimientoDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['Correctivo', 'Preventivo'])
  tipo?: 'Correctivo' | 'Preventivo';

  /** Código legible de la máquina (ej. "M001"). */
  @IsOptional()
  @IsString()
  maquinaId?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}
