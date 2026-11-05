import { IsString, IsUUID, IsNumber, IsOptional, Min, Max, MinLength } from 'class-validator';

export class MarcarEntradaDto {
  @IsUUID()
  trabajadorId!: string;

  /**
   * La geocerca se valida con la ubicación y el radio GUARDADOS de esta obra (tabla `obras`), nunca con
   * coordenadas que mande el cliente: si no, cualquiera podría declarar la obra donde está y salir "en sitio".
   */
  @IsUUID()
  obraId!: string;

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
