import {
  IsString,
  IsIn,
  IsNumber,
  IsOptional,
  IsDateString,
  IsBoolean,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { HORA_HHMM, TELEFONO_VALIDO, recortar } from '../../common/validacion';

export const CATEGORIAS_PUESTO = ['Operador', 'Chofer', 'Mecanico', 'Ingeniero', 'Administrativo'] as const;
export const CATEGORIAS_LICENCIA = ['DC3', 'Licencia Federal', 'Certificado Técnico', 'Cédula Profesional', 'Otro'] as const;

/** Tope de las columnas Decimal(12,2) de sueldo: un monto mayor daba 500 al guardar. */
export const MONTO_MAXIMO = 9_999_999_999;

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
  @Transform(recortar)
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombre!: string;

  @Transform(recortar)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  puesto!: string;

  @IsIn(CATEGORIAS_PUESTO)
  categoriaPuesto!: (typeof CATEGORIAS_PUESTO)[number];

  @Transform(recortar)
  @IsString()
  @MinLength(7)
  @MaxLength(20)
  @Matches(TELEFONO_VALIDO, { message: 'telefono debe tener al menos 7 dígitos (solo números, espacios, guiones, paréntesis o +)' })
  telefono!: string;

  /** Hora de entrada, formato 24h "HH:mm". */
  @IsString()
  @Matches(HORA_HHMM, { message: 'entrada debe tener formato HH:mm (24 horas)' })
  entrada!: string;

  @IsNumber()
  @Min(0)
  @Max(MONTO_MAXIMO)
  sueldoFiscal!: number;

  @IsNumber()
  @Min(0)
  @Max(MONTO_MAXIMO)
  sueldoEfectivo!: number;

  @IsIn(['Tarjeta', 'Efectivo', 'Mixto'])
  metodoPago!: 'Tarjeta' | 'Efectivo' | 'Mixto';

  /** Nombre de un proyecto activo (opcional). */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  proyecto?: string;

  /** Código legible de la máquina (ej. "M001") si se asigna como operador. */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  maquinaId?: string;

  /**
   * Fecha de ingreso, obligatoria: de ella sale la antigüedad del finiquito. Antes, si faltaba, se guardaba la
   * fecha del alta sin avisar. No puede ser futura (lo revisa el servicio).
   */
  @IsDateString()
  fechaContratacion!: string;

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
  @MaxLength(200)
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
