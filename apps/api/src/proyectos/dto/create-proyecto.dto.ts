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
  Matches,
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

  /** ── Ubicación exacta de la obra (opcional en BD, obligatoria en UI) ── */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  calle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  colonia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  municipio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  ciudad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  estadoUbicacion?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{5}$/, { message: 'El código postal debe ser de 5 dígitos' })
  codigoPostal?: string;
}
