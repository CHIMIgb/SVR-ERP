import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { EstadoOrdenCompra } from '@prisma/client';

export class CambiarEstadoOrdenDto {
  @IsEnum(EstadoOrdenCompra)
  estado!: EstadoOrdenCompra;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;
}