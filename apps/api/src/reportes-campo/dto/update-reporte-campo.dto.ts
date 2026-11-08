import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MinLength, MaxLength } from 'class-validator';
import { Prioridad, TipoReporteCampo, CategoriaReporte } from '@prisma/client';

// La fecha y la hora del incidente son automáticas: ya no se editan.

export class UpdateReporteCampoDto {
  @IsOptional()
  @IsEnum(TipoReporteCampo)
  tipo?: TipoReporteCampo;

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
