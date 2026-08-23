import { IsString, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateLecturaHorometroDto {
  /** Código legible de la máquina (ej. "M001"), no el UUID interno. */
  @IsString()
  maquinaId!: string;

  @IsDateString()
  fecha!: string;

  @IsNumber()
  @Min(0)
  lecturaInicial!: number;

  @IsNumber()
  @Min(0)
  lecturaFinal!: number;
}
