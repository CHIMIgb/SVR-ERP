import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
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
