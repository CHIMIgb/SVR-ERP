import { IsString, IsUUID, IsNumber, IsOptional, IsBoolean, Min, Max, MinLength, MaxLength, ValidateIf } from 'class-validator';

/** Una jornada es de un día: no puede tener más horas que las del día. */
export const HORAS_MAX_POR_DIA = 24;

export class MarcarSalidaDto {
  @IsUUID()
  trabajadorId!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precisionGpsMetros?: number;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  dispositivo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  ubicacion?: string;

  @IsOptional()
  @IsBoolean()
  salidaAnticipada?: boolean;

  @ValidateIf((o) => o.salidaAnticipada === true)
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  motivoSalidaAnticipada?: string;

  /** Override manual de horas laboradas; si se omite se calcula desde la entrada. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(HORAS_MAX_POR_DIA)
  horasTrabajadasOrdinarias?: number;
}
