import {
  IsBoolean,
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

  /**
   * Torre responsable a la que se ENVÍA el incidente. Si viene `mismaArea`,
   * este campo se ignora y el backend resuelve la torre con el puesto del
   * trabajador que reporta (fallback: ADMINISTRATIVO).
   */
  @IsOptional()
  @IsEnum(CategoriaReporte)
  categoria?: CategoriaReporte;

  @IsOptional()
  @IsBoolean()
  mismaArea?: boolean;

  /** Subcategoría del catálogo por torre (opcional; debe pertenecer a la categoría). */
  @IsOptional()
  @IsUUID()
  subcategoriaId?: string;

  /** Quién reporta desde campo (texto libre, ej. "Marcos G."). */
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  usuario!: string;

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
