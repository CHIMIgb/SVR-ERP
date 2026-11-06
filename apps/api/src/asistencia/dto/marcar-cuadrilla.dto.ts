import { IsString, IsUUID, IsNumber, IsOptional, IsArray, ArrayMinSize, ArrayMaxSize, Min, Max, MinLength, MaxLength } from 'class-validator';

export class MarcarCuadrillaDto {
  /** La geocerca se valida con la ubicación y el radio guardados de esta obra, no con datos del cliente. */
  @IsUUID()
  obraId!: string;

  /** Una cuadrilla real no pasa de unas decenas; el tope evita una petición con miles de marcajes. */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  trabajadorIds!: string[];

  /** Ubicación del dispositivo del cabo/supervisor que pasa lista. */
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
}
