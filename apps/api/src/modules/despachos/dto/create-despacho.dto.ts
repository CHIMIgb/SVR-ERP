import { IsString, IsDateString, IsNotEmpty, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { recortar } from '../../../common/validacion';

export class CreateDespachoDto {
  /** Código legible de la máquina (ej. "M001"). */
  @Transform(recortar)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  maquinaId!: string;

  /** Código legible del proyecto (ej. "P001"). */
  @Transform(recortar)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  proyectoId!: string;

  @IsDateString()
  fechaInicio!: string;

  @IsDateString()
  fechaFin!: string;
}
