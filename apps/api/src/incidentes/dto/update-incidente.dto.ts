import {
  IsString,
  IsUUID,
  IsOptional,
  MaxLength,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Prioridad, EstadoIncidente } from '@prisma/client';

export class UpdateIncidenteDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  titulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descripcion?: string;

  @IsOptional()
  @IsEnum(Prioridad)
  prioridad?: Prioridad;

  @IsOptional()
  @IsEnum(EstadoIncidente)
  estado?: EstadoIncidente;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsUUID()
  maquinaId?: string;

  @IsOptional()
  @IsUUID()
  obraId?: string;
}
