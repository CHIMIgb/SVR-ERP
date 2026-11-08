import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, IsUUID, Matches, MaxLength, Min, MinLength } from 'class-validator';
import { Prioridad, TipoReporteCampo, CategoriaReporte } from '@prisma/client';

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
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'hora debe tener formato HH:mm' })
  hora?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  descripcion?: string;

  @IsOptional()
  @IsEnum(Prioridad)
  prioridad?: Prioridad;
}
