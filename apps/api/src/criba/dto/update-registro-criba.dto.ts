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
