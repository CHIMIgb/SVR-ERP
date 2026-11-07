import { IsDateString, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryLecturaHorometroDto {
  /** Busca por código o nombre de la máquina. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  /** Código legible de la máquina (ej. "M001"). */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  maquinaId?: string;

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}
