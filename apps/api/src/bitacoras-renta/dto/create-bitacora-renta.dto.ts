import { IsString, IsUUID, IsNumber, IsOptional, IsBoolean, IsDateString, Matches, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';
import { HORA_HHMM } from '../../common/validacion';

/** Tope de las columnas Decimal(10,2) de horómetro y tarifa: un número mayor daba 500 al guardar. */
const VALOR_MAXIMO = 99_999_999;

export class CreateBitacoraRentaDto {
  @IsUUID()
  trabajadorId!: string;

  /** Código legible de la máquina (ej. "M001"). */
  @IsString()
  maquinaId!: string;

  @IsDateString()
  fecha!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  cliente!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  obraUbicacion!: string;

  /** Formato 24h "HH:mm". */
  @IsString()
  @Matches(HORA_HHMM, { message: 'horaInicio debe tener formato HH:mm (24 horas)' })
  horaInicio!: string;

  @IsString()
  @Matches(HORA_HHMM, { message: 'horaFin debe tener formato HH:mm (24 horas)' })
  horaFin!: string;

  /** Horas de un solo día: con las extras no pueden pasar de 24 (lo revisa el servicio). */
  @IsNumber()
  @Min(0)
  @Max(24)
  horasEfectivas!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(24)
  horasExtras?: number;

  @IsNumber()
  @Min(0)
  @Max(VALOR_MAXIMO)
  horometroInicial!: number;

  @IsNumber()
  @Min(0)
  @Max(VALOR_MAXIMO)
  horometroFinal!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  actividadRealizada!: string;

  @IsNumber()
  @Min(0.01)
  @Max(VALOR_MAXIMO)
  tarifaHoraRenta!: number;

  @IsOptional()
  @IsBoolean()
  firmado?: boolean;

  @ValidateIf((o) => o.firmado === true)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombreResidente?: string;

  @ValidateIf((o) => o.firmado === true)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  cargoResidente?: string;
}
