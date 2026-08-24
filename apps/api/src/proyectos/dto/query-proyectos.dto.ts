import {
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoProyecto } from '@prisma/client';

export class QueryProyectosDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(EstadoProyecto)
  estado?: EstadoProyecto;

  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}
