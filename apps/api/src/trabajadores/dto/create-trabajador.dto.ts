import {
  IsString,
  IsIn,
  IsNumber,
  IsOptional,
  IsDateString,
  IsBoolean,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export const CATEGORIAS_PUESTO = ['Operador', 'Chofer', 'Mecanico', 'Ingeniero', 'Administrativo'] as const;
export const CATEGORIAS_LICENCIA = ['DC3', 'Licencia Federal', 'Certificado Técnico', 'Cédula Profesional', 'Otro'] as const;

export class LicenciaDto {
  @IsString()
  @MinLength(2)
  tipo!: string;

  @IsIn(CATEGORIAS_LICENCIA)
  categoria!: (typeof CATEGORIAS_LICENCIA)[number];

  @IsString()
  @MinLength(2)
  folio!: string;

  @IsOptional()
  @IsDateString()
  vigencia?: string;

  @IsOptional()
  @IsBoolean()
  vigenciaIndefinida?: boolean;
}

export class ContactoEmergenciaDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsString()
  @MinLength(7)
  telefono!: string;

  @IsString()
  @MinLength(2)
  parentesco!: string;
}

export class CreateTrabajadorDto {
  @IsString()
  @MinLength(3)
  nombre!: string;

  @IsString()
  @MinLength(2)
  puesto!: string;

  @IsIn(CATEGORIAS_PUESTO)
  categoriaPuesto!: (typeof CATEGORIAS_PUESTO)[number];

  @IsString()
  @MinLength(7)
  telefono!: string;

  /** Hora de entrada, formato 24h "HH:mm". */
  @IsString()
  entrada!: string;

  @IsNumber()
  @Min(0)
  sueldoFiscal!: number;

  @IsNumber()
  @Min(0)
  sueldoEfectivo!: number;

  @IsIn(['Tarjeta', 'Efectivo', 'Mixto'])
  metodoPago!: 'Tarjeta' | 'Efectivo' | 'Mixto';

  /** Nombre del proyecto asignado (opcional; se vincula si existe). */
  @IsOptional()
  @IsString()
  proyecto?: string;

  /** Código legible de la máquina (ej. "M001") si se asigna como operador. */
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
