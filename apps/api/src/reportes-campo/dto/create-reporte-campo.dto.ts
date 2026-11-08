import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Prioridad, TipoReporteCampo, CategoriaReporte } from '@prisma/client';

export class CreateReporteCampoDto {
  @IsEnum(TipoReporteCampo)
  tipo!: TipoReporteCampo;

  /** Torre responsable que atenderá el incidente (ruta "le cae a todos de X torre"). */
  @IsEnum(CategoriaReporte)
  categoria!: CategoriaReporte;

  /** Subcategoría del catálogo por torre (opcional; debe pertenecer a la categoría). */
  @IsOptional()
  @IsUUID()
  subcategoriaId?: string;

  /** Quién reporta desde campo (texto libre, ej. "Marcos G."). */
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  usuario!: string;

  @IsOptional()
  @IsUUID()
  maquinaId?: string;

  @IsOptional()
  @IsUUID()
  obraId?: string;

  /** Texto de la obra — la ubicación también puede ser GPS (latitud/longitud). */
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  obraTexto?: string;

  /** Ubicación GPS ("Mi ubicación actual"): ambos o ninguno. */
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

  @IsDateString()
  fecha!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'hora debe tener formato HH:mm' })
  hora!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  descripcion!: string;

  @IsOptional()
  @IsEnum(Prioridad)
  prioridad?: Prioridad;
}
