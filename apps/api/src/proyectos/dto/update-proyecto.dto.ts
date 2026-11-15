import {
  IsString,
  IsUUID,
  IsOptional,
  MaxLength,
  IsDateString,
  IsEnum,
  IsNumber,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { EstadoProyecto } from '@prisma/client';

export class UpdateProyectoDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nombre?: string;

  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  presupuesto?: number;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

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

  /** ── Ubicación exacta (opcional; la UI la demanda) ── */
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
