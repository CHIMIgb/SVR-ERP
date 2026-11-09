import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Prioridad, CategoriaReporte } from '@prisma/client';

// El `tipo` se deriva del área (torre) — ya no se captura ni edita.
// La fecha y la hora también son automáticas: ya no se editan.

export class UpdateReporteCampoDto {
  @IsOptional()
  @IsEnum(CategoriaReporte)
  categoria?: CategoriaReporte;

  @IsOptional()
  @IsBoolean()
  mismaArea?: boolean;

  @IsOptional()
  @IsUUID()
  subcategoriaId?: string;

  /** Ubicación — proyecto EN_PROCESO o GPS (lat/long ambos o ninguno). */
  @IsOptional()
  @IsUUID()
  proyectoId?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitud?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitud?: number;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  usuario?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  descripcion?: string;

  @IsOptional()
  @IsEnum(Prioridad)
  prioridad?: Prioridad;
}
