import { IsNumber, IsOptional, IsString, IsUUID, IsEnum, IsDateString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Prioridad, TipoReporteCampo, CategoriaReporte } from '@prisma/client';

export class UpdateReporteCampoDto {
  @IsOptional()
  @IsEnum(TipoReporteCampo)
  tipo?: TipoReporteCampo;

  @IsOptional()
  @IsEnum(CategoriaReporte)
  categoria?: CategoriaReporte;

  @IsOptional()
  @IsUUID()
  subcategoriaId?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  usuario?: string;

  @IsOptional()
  @IsUUID()
  maquinaId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  obraTexto?: string;

  @IsOptional()
  @IsUUID()
  obraId?: string;

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
