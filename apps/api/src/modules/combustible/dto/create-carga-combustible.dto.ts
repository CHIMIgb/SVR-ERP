import { IsString, IsNumber, IsOptional, IsDateString, Min, MinLength } from 'class-validator';

export class CreateCargaCombustibleDto {
  /** Código legible de la máquina (ej. "M001"), no el UUID interno. */
  @IsString()
  maquinaId!: string;

  @IsNumber()
  @Min(0.1)
  litros!: number;

  @IsNumber()
  @Min(0)
  horasTrabajadasPeriodo!: number;

  @IsString()
  @MinLength(3)
  lugar!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costo?: number;

  @IsOptional()
  @IsString()
  operador?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;
}
