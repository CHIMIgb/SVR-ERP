import { IsNumber, IsOptional, IsString, MaxLength, Min, MinLength, IsDateString, IsIn, IsEnum, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRetiroDto {
  @IsString()
  @MaxLength(200)
  concepto!: string;

  @IsNumber()
  @Min(0.01)
  monto!: number;

  @IsString()
  @MaxLength(100)
  autorizadoPor!: string;
}

export class CreateCierreDto {
  /** Conteo por denominación: { "1000": 1, "500": 3, ... } */
  @IsOptional()
  denominaciones?: Record<string, number>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  efectivoInicial?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fondoSiguiente?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notas?: string;
}

export class CreateAperturaDto {
  /** Fondo inicial con el que se abre la caja del turno. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  fondoInicial?: number;
}

export class RechazarCierreDto {
  /** Motivo por el que el Administrador rechaza el cierre. */
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  motivo!: string;
}

export class QueryCierresDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['PENDIENTE', 'APROBADO', 'RECHAZADO'])
  estado?: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}

export class UpdateConfigDto {
  @IsOptional()
  @IsString()
  @IsIn(['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'])
  apertura?: string;

  @IsOptional()
  @IsString()
  @IsIn(['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'])
  cierre?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(1440)
  toleranciaMinutos?: number;
}

