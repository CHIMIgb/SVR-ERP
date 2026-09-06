import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export const ESTADOS_CXC = ['PENDIENTE', 'PARCIAL', 'SALDADO'] as const;
export const SITUACIONES_CXC = ['AL_CORRIENTE', 'ATRASO_LEVE', 'ATRASO_GRAVE', 'SALDADO'] as const;

export class ListarCuentasQuery {
  @IsOptional()
  @IsIn(ESTADOS_CXC)
  estado?: string;

  @IsOptional()
  @IsIn(SITUACIONES_CXC)
  situacion?: string;

  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}