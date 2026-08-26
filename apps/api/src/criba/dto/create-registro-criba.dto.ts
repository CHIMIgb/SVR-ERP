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

/** Materiales válidos de la planta — coincide con el catálogo del frontend. */
export const MATERIALES_CRIBA = ['Criba fina', 'Criba gruesa', 'Arena lavada'] as const;

export class CreateRegistroCribaDto {
  @IsDateString()
  fecha!: string;

  @IsEnum(Turno)
  turno!: Turno;

  /** UUID del trabajador operador (opcional; resuelve el nombre por relación). */
  @IsOptional()
  @IsUUID()
  operadorId?: string;

  @IsString()
  @IsIn(MATERIALES_CRIBA)
  tipoMaterial!: string;

  @IsNumber()
  @Min(0.01)
  materialProducido!: number;

  /** Horas del turno — un turno no puede exceder 24h. */
  @IsNumber()
  @Min(0.1)
  @Max(24)
  horasTrabajadas!: number;

  @IsNumber()
  @Min(0)
  materialAlBanco!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;
}
