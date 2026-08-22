import { IsString, IsNumber, IsBoolean, IsIn, Min, MaxLength } from 'class-validator';

export class CreateChecklistDto {
  /** Código legible de la máquina (ej. "M001"). */
  @IsString()
  maquinaId!: string;

  @IsString()
  @MaxLength(150)
  operador!: string;

  @IsNumber()
  @Min(0)
  horometroInicial!: number;

  @IsIn(['Correcto', 'Bajo', 'Exceso'])
  nivelAceiteMotor!: 'Correcto' | 'Bajo' | 'Exceso';

  @IsIn(['Correcto', 'Bajo'])
  nivelHidraulico!: 'Correcto' | 'Bajo';

  @IsBoolean()
  fugasVisibles!: boolean;

  @IsIn(['Correcto', 'Desgaste Severo', 'Daño'])
  estadoLlantasOrugas!: 'Correcto' | 'Desgaste Severo' | 'Daño';

  @IsIn(['Correcto', 'Falla'])
  sistemaFrenos!: 'Correcto' | 'Falla';

  @IsString()
  @MaxLength(500)
  observaciones!: string;
}
