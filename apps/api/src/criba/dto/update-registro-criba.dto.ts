import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Turno } from '@prisma/client';
import { MATERIALES_CRIBA } from './create-registro-criba.dto';

export class UpdateRegistroCribaDto {
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsEnum(Turno)
  turno?: Turno;

  @IsOptional()
  @IsUUID()
  operadorId?: string;

  /** B6: máquina que produjo el material (código, ej. M001; opcional). */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  maquinaId?: string;

  /** B6: proyecto de destino del material (opcional; debe estar EN_PROCESO). */
  @IsOptional()
  @IsUUID()
  proyectoId?: string;

  @IsOptional()
  @IsString()
  @IsIn(MATERIALES_CRIBA)
  tipoMaterial?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  materialProducido?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(24)
  horasTrabajadas?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  materialAlBanco?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;
}
