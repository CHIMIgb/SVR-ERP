import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class RegistrarHorasExtraDto {
  /** Hora de inicio del turno extraordinario, formato "HH:mm". */
  @IsString()
  inicio!: string;

  /** Hora de fin; si se omite, el turno extra sigue "en curso". */
  @IsOptional()
  @IsString()
  fin?: string;

  @IsNumber()
  @Min(0.5)
  horasCalculadas!: number;

  /** Si se omite, se usa la tarifa del trabajador (o $80/hr por defecto). */
  @IsOptional()
  @IsNumber()
  @Min(0)
  tarifaPorHora?: number;

  @IsOptional()
  @IsString()
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
