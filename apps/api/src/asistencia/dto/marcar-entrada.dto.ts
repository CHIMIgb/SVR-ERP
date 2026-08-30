import { IsString, IsUUID, IsNumber, IsOptional, Min, Max, MinLength } from 'class-validator';

export class MarcarEntradaDto {
  @IsUUID()
  trabajadorId!: string;

  @IsUUID()
  obraId!: string;

  /** Coordenadas del centro de la obra en el momento del marcaje. */
  @IsNumber()
  @Min(-90)
  @Max(90)
  obraLat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  obraLng!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  radioPermitidoMetros?: number;

  /** Coordenadas GPS reportadas por el dispositivo del trabajador. */
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
  @IsNumber()
  @Min(0)
  @Max(100)
  bateria?: number;

  @IsOptional()
  @IsString()
  ubicacion?: string;

  @IsOptional()
  @IsString()
  notas?: string;
}
