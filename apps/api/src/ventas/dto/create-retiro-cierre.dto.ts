import { IsNumber, IsOptional, IsString, MaxLength, Min, MinLength, IsDateString, IsIn, IsEnum, Max, Matches } from 'class-validator';
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
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'apertura debe tener formato HH:mm (24h)' })
  apertura?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'cierre debe tener formato HH:mm (24h)' })
  cierre?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(1440)
  toleranciaMinutos?: number;
}

