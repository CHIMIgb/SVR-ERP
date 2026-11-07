import { IsDateString, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryDespachoDto {
  /** Código legible de la máquina (ej. "M001"). */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  maquinaId?: string;

  /** Con `hasta`: solo los despachos que se encimen con ese rango (el cronograma pide su ventana de días). */
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
