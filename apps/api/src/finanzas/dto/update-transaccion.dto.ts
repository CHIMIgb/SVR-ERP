import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TipoTransaccion } from '@prisma/client';
import { CATEGORIAS_FINANZAS } from './create-transaccion.dto';

export class UpdateTransaccionDto {
  @IsOptional()
  @IsEnum(TipoTransaccion)
  tipo?: TipoTransaccion;

  @IsOptional()
  @IsString()
  @IsIn(CATEGORIAS_FINANZAS)
  categoria?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  monto?: number;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  descripcion?: string;

  /** Categoría personalizada cuando `categoria` es "Otros". */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  otraCategoria?: string;
}
