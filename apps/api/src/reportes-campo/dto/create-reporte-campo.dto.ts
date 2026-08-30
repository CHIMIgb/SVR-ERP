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

export class CreateReporteCampoDto {
  @IsEnum(TipoReporteCampo)
  tipo!: TipoReporteCampo;

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

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  obraTexto!: string;

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
