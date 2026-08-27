import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { EstadoCotizacion } from '@prisma/client';

export class CreateCotizacionDto {
  @IsString()
  @MaxLength(500)
  descripcion!: string;

  @IsNumber()
  @Min(0)
  monto!: number;

  @IsDateString()
  fecha!: string;

  @IsOptional()
  @IsEnum(EstadoCotizacion)
  estado?: EstadoCotizacion;
}
