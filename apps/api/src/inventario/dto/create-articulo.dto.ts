import {
  IsString,
  IsNumber,
  IsUUID,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateArticuloDto {
  @IsString()
  @MaxLength(200)
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  codigo?: string;

  @IsUUID()
  categoriaId!: string;

  @IsUUID()
  proveedorId!: string;

  @IsUUID()
  unidadId!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stockMinimo!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  precioUnitario!: number;
}
