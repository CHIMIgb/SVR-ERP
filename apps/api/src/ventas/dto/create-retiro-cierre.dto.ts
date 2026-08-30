import { IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

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
