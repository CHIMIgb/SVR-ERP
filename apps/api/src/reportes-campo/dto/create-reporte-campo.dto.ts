import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Prioridad, TipoReporteCampo, CategoriaReporte } from '@prisma/client';

export class CreateReporteCampoDto {
  @IsEnum(TipoReporteCampo)
  tipo!: TipoReporteCampo;

  /** Torre responsable que atenderá el reporte (ruta "le cae a todos de X torre"). */
  @IsEnum(CategoriaReporte)
  categoria!: CategoriaReporte;

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

  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @IsUUID()
  proyectoId?: string;

  /** Monto del servicio cobrable al cliente (permite facturar el reporte). */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  montoServicio?: number;

  /** Texto de la obra — opcional (hay reportes que no se relacionan con obra). */
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  obraTexto?: string;

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
