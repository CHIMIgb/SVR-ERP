import { IsString, IsDateString } from 'class-validator';

export class CreateDespachoDto {
  /** Código legible de la máquina (ej. "M001"). */
  @IsString()
  maquinaId!: string;

  /** Código legible del proyecto (ej. "P001"). */
  @IsString()
  proyectoId!: string;

  @IsDateString()
  fechaInicio!: string;

  @IsDateString()
  fechaFin!: string;
}
