import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';

/**
 * Tipos de geocerca. Debe coincidir con el CHECK `chk_geocercas_tipo` de la
 * tabla: cualquier otro valor lo rechaza la base de datos, no el DTO.
 */
export const TIPOS_GEOCERCA = ['OBRA', 'PATIO', 'ESTACION', 'RUTA', 'PROHIBIDA'] as const;
export type TipoGeocerca = (typeof TIPOS_GEOCERCA)[number];

export class CreateGeocercaDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombre!: string;

  @IsIn(TIPOS_GEOCERCA)
  tipo!: TipoGeocerca;

  /** Color hex para pintarla en el mapa (ej. "#3b82f6"). */
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'color debe ser un hex de 6 dígitos (ej. #3b82f6)' })
  color?: string;

  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-90)
  @Max(90)
  centroLat!: number;

  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-180)
  @Max(180)
  centroLng!: number;

  /** Radio en metros: mínimo 10 m (bajo eso el GPS no distingue), máximo 50 km. */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(10)
  @Max(50000)
  radioMetros!: number;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
