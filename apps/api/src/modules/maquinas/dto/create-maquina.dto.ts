import { IsString, IsOptional, IsNumber, Min, MaxLength } from 'class-validator';

export class CreateMaquinaDto {
  /** Código legible elegido por el usuario (ej. "M005"). */
  @IsString()
  @MaxLength(20)
  id!: string;

  @IsString()
  @MaxLength(20)
  tipo!: string;

  @IsString()
  @MaxLength(150)
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  operador?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  horometro?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  combustible?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  consumoEsperado?: number;
}
