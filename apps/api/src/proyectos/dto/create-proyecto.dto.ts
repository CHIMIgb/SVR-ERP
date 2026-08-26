import {
  IsString,
  IsUUID,
  IsOptional,
  MaxLength,
  IsDateString,
  IsEnum,
  IsNumber,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { EstadoProyecto } from '@prisma/client';

export class CreateProyectoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre!: string;

  @IsUUID()
  clienteId!: string;

  @IsNumber()
  @Min(0.01)
  presupuesto!: number;

  @IsDateString()
  fechaInicio!: string;

  @IsDateString()
  fechaFin!: string;

  @IsOptional()
  @IsEnum(EstadoProyecto)
  estado?: EstadoProyecto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progreso?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ingresoCobrado?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  gastado?: number;
}
