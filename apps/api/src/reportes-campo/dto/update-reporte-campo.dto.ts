import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Prioridad, TipoReporteCampo } from '@prisma/client';

export class UpdateReporteCampoDto {
  @IsOptional()
  @IsEnum(TipoReporteCampo)
  tipo?: TipoReporteCampo;

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
