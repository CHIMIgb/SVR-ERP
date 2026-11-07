import { IsString, IsNumber, IsOptional, Min, Max, Matches, MaxLength } from 'class-validator';
import { HORA_HHMM } from '../../common/validacion';
import { HORAS_MAX_POR_DIA } from './marcar-salida.dto';

/** Tope de la columna `horas_extra_asistencia.tarifa_por_hora` (Decimal(10,2)). */
export const TARIFA_HORA_EXTRA_MAX = 99_999_999.99;

export class RegistrarHorasExtraDto {
  /** Hora de inicio del turno extraordinario, formato "HH:mm". */
  @Matches(HORA_HHMM, { message: 'inicio debe tener formato HH:mm' })
  inicio!: string;

  /** Hora de fin; si se omite, el turno extra sigue "en curso". */
  @IsOptional()
  @Matches(HORA_HHMM, { message: 'fin debe tener formato HH:mm' })
  fin?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.5)
  @Max(HORAS_MAX_POR_DIA)
  horasCalculadas!: number;

  /**
   * Si se omite, se usa la tarifa del trabajador (o la de referencia). Si se manda, queda marcada en la
   * auditoría como tarifa capturada a mano.
   */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(TARIFA_HORA_EXTRA_MAX)
  tarifaPorHora?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latInicio?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lngInicio?: number;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latFin?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lngFin?: number;
}
