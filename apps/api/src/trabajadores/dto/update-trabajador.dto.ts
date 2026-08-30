import {
  IsString,
  IsIn,
  IsNumber,
  IsOptional,
  IsDateString,
  MinLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CATEGORIAS_PUESTO, LicenciaDto, ContactoEmergenciaDto } from './create-trabajador.dto';

export const ESTADOS_TRABAJADOR = ['Activo', 'Inactivo', 'Vacaciones'] as const;

export class UpdateTrabajadorDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  puesto?: string;

  @IsOptional()
  @IsIn(CATEGORIAS_PUESTO)
  categoriaPuesto?: (typeof CATEGORIAS_PUESTO)[number];

  @IsOptional()
  @IsIn(ESTADOS_TRABAJADOR)
  estado?: (typeof ESTADOS_TRABAJADOR)[number];

  @IsOptional()
  @IsString()
  @MinLength(7)
  telefono?: string;

  @IsOptional()
  @IsString()
  entrada?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sueldoFiscal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sueldoEfectivo?: number;

  @IsOptional()
  @IsIn(['Tarjeta', 'Efectivo', 'Mixto'])
  metodoPago?: 'Tarjeta' | 'Efectivo' | 'Mixto';

  @IsOptional()
  @IsString()
  proyecto?: string;

  @IsOptional()
  @IsString()
  maquinaId?: string;

  @IsOptional()
  @IsDateString()
  fechaContratacion?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vacacionesDias?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  horasExtraSemana?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tarifaHoraExtra?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  descuentosSemana?: number;

  @IsOptional()
  @IsString()
  conceptoDescuento?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LicenciaDto)
  licencia?: LicenciaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactoEmergenciaDto)
  contactoEmergencia?: ContactoEmergenciaDto;
}
