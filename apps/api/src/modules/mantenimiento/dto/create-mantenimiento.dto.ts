import { IsString, IsIn, IsNumber, IsDateString, Min, MinLength } from 'class-validator';

export class CreateMantenimientoDto {
  /** Código legible de la máquina (ej. "M001"), no el UUID interno. */
  @IsString()
  maquinaId!: string;

  @IsIn(['Correctivo', 'Preventivo'])
  tipo!: 'Correctivo' | 'Preventivo';

  @IsString()
  @MinLength(3)
  descripcion!: string;

  @IsDateString()
  fecha!: string;

  @IsNumber()
  @Min(0)
  horasServicio!: number;

  @IsNumber()
  @Min(0)
  costo!: number;

  @IsNumber()
  @Min(0)
  proximoServicioHoras!: number;
}
