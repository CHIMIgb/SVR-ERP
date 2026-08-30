import { IsString, IsUUID, IsNumber, IsOptional, IsBoolean, Min, Max, MinLength, ValidateIf } from 'class-validator';

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
  dispositivo!: string;

  @IsOptional()
  @IsString()
  ubicacion?: string;

  @IsOptional()
  @IsBoolean()
  salidaAnticipada?: boolean;

  @ValidateIf((o) => o.salidaAnticipada === true)
  @IsString()
  @MinLength(3)
  motivoSalidaAnticipada?: string;

  /** Override manual de horas laboradas; si se omite se calcula desde la entrada. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  horasTrabajadasOrdinarias?: number;
}
