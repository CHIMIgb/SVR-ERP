import {
  IsString,
  IsUUID,
  IsOptional,
  MaxLength,
  IsDateString,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { Prioridad, EstadoIncidente } from '@prisma/client';

export class CreateIncidenteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  titulo!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  descripcion!: string;

  @IsEnum(Prioridad)
  prioridad!: Prioridad;

  @IsEnum(EstadoIncidente)
  estado!: EstadoIncidente;

  @IsDateString()
  fecha!: string;

  @IsOptional()
  @IsUUID()
  maquinaId?: string;

  @IsUUID()
  obraId!: string;
}
