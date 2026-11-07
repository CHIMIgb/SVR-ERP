import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString, IsIn, Matches, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';
import { HORA_HHMM } from '../../common/validacion';

/** Tope de las columnas Decimal(10,2) de horómetro y tarifa: un número mayor daba 500 al guardar. */
const VALOR_MAXIMO = 99_999_999;

export const ESTADOS_COBRO_BITACORA = ['Listo para Facturar', 'Facturado', 'Pendiente Firma'] as const;

export class UpdateBitacoraRentaDto {
  @IsOptional()
  @IsString()
  maquinaId?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  cliente?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  obraUbicacion?: string;

  @IsOptional()
  @IsString()
  @Matches(HORA_HHMM, { message: 'horaInicio debe tener formato HH:mm (24 horas)' })
  horaInicio?: string;

  @IsOptional()
  @IsString()
  @Matches(HORA_HHMM, { message: 'horaFin debe tener formato HH:mm (24 horas)' })
  horaFin?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(24)
  horasEfectivas?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(24)
  horasExtras?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(VALOR_MAXIMO)
  horometroInicial?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(VALOR_MAXIMO)
  horometroFinal?: number;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  actividadRealizada?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(VALOR_MAXIMO)
  tarifaHoraRenta?: number;

  @IsOptional()
  @IsBoolean()
  firmado?: boolean;

  /** Igual que al crear: si se marca como firmada, el nombre y el cargo del residente son obligatorios. */
  @ValidateIf((o) => o.firmado === true || o.nombreResidente !== undefined)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombreResidente?: string;

  @ValidateIf((o) => o.firmado === true || o.cargoResidente !== undefined)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  cargoResidente?: string;

  @IsOptional()
  @IsIn(ESTADOS_COBRO_BITACORA)
  estadoCobro?: (typeof ESTADOS_COBRO_BITACORA)[number];
}
