import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Prioridad, CategoriaReporte } from '@prisma/client';

// El `tipo` del reporte es interno y se deriva del área (torre) elegida —
// el vocabulario viejo ("Área tipo de reporte") queda fuera del UI y del API.
// La fecha y la hora son automáticas (se registran con la hora del servidor).

export class CreateReporteCampoDto {
  /**
   * Torre responsable a la que se ENVÍA el incidente. Si viene `mismaArea`,
   * este campo se ignora y el backend resuelve la torre con el rol/puesto del
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

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  descripcion!: string;

  @IsOptional()
  @IsEnum(Prioridad)
  prioridad?: Prioridad;
}
