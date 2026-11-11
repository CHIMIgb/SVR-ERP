import {
  IsString,
  IsIn,
  IsNumber,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsInt,
  IsUUID,
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
/** Tope de las columnas Decimal(10,2) (tarifa de hora extra y descuentos de la semana). */
export const MONTO_MAXIMO_10_2 = 99_999_999;
/** Una semana tiene 168 h: más horas extra que eso no son posibles (la columna es Decimal(6,2)). */
export const HORAS_SEMANA_MAXIMAS = 168;
/** La columna de vacaciones es Int: días enteros, hasta un año. */
export const VACACIONES_DIAS_MAXIMO = 365;

export class LicenciaDto {
  @Transform(recortar)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  tipo!: string;

  @IsIn(CATEGORIAS_LICENCIA)
  categoria!: (typeof CATEGORIAS_LICENCIA)[number];

  @Transform(recortar)
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  folio!: string;

  @IsOptional()
  @IsDateString()
  vigencia?: string;

  @IsOptional()
  @IsBoolean()
  vigenciaIndefinida?: boolean;
}

export class ContactoEmergenciaDto {
  @Transform(recortar)
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nombre!: string;

  // Misma regla que el teléfono del trabajador (antes aceptaba cualquier texto de 7 caracteres).
  @Transform(recortar)
  @IsString()
  @MinLength(7)
  @MaxLength(20)
  @Matches(TELEFONO_VALIDO, { message: 'telefono debe tener al menos 7 dígitos (solo números, espacios, guiones, paréntesis o +)' })
  telefono!: string;

  @Transform(recortar)
  @IsString()
  @MinLength(2)
  @MaxLength(50)
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

  // Topes de las columnas: antes un valor fuera de rango pasaba el DTO y la BD respondía con un 500.
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(VACACIONES_DIAS_MAXIMO)
  vacacionesDias?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(HORAS_SEMANA_MAXIMAS)
  horasExtraSemana?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MONTO_MAXIMO_10_2)
  tarifaHoraExtra?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MONTO_MAXIMO_10_2)
  descuentosSemana?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  conceptoDescuento?: string;

  /** Rol de acceso a la app (§6.6): el administrativo elige el rol y el sistema crea el usuario con PIN temporal. */
  @IsUUID(undefined, { message: 'rolId debe ser un UUID válido (rol de acceso a la app)' })
  rolId!: string;

  /** Encargado (Residente) al que reporta — opcional (§6.8: el Residente ve a su equipo). */
  @IsOptional()
  @IsUUID(undefined, { message: 'encargadoId debe ser un UUID válido' })
  encargadoId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LicenciaDto)
  licencia?: LicenciaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactoEmergenciaDto)
  contactoEmergencia?: ContactoEmergenciaDto;
}
