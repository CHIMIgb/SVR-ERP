import { IsString, IsUUID, IsNumber, IsOptional, IsBoolean, Min, Max, MinLength, MaxLength, ValidateIf } from 'class-validator';

/**
 * Entrada que checa el propio trabajador desde la PWA. A diferencia de `MarcarEntradaDto` NO lleva
 * `trabajadorId`: el trabajador sale del token (`trabajadores.usuario_id`). Como el ValidationPipe es
 * `forbidNonWhitelisted`, mandar `trabajadorId` aquí da 400 en vez de checar por otro.
 */
export class MarcarEntradaPropiaDto {
  /** Debe ser una de las obras que tiene asignadas (proyecto activo); si no, 403. */
  @IsUUID()
  obraId!: string;

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
  @IsNumber()
  @Min(0)
  @Max(100)
  bateria?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  ubicacion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notas?: string;
}

/**
 * Salida que checa el propio trabajador. Sin `trabajadorId` (sale del token) y sin el override manual de
 * horas: eso lo captura la administradora, no el trabajador sobre sí mismo.
 */
export class MarcarSalidaPropiaDto {
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
}
