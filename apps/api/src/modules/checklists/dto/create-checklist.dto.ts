import { IsString, IsNumber, IsBoolean, IsIn, Min, Max, MaxLength, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { recortar } from '../../../common/validacion';

export class CreateChecklistDto {
  /** Código legible de la máquina (ej. "M001"). */
  @Transform(recortar)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  maquinaId!: string;

  @Transform(recortar)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  operador!: string;

  /** Tope de la columna `horometro_inicial` (Decimal(10,2)). */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99_999_999.99)
  horometroInicial!: number;

  @IsIn(['Correcto', 'Bajo', 'Exceso'])
  nivelAceiteMotor!: 'Correcto' | 'Bajo' | 'Exceso';

  @IsIn(['Correcto', 'Bajo'])
  nivelHidraulico!: 'Correcto' | 'Bajo';

  @IsBoolean()
  fugasVisibles!: boolean;

  @IsIn(['Correcto', 'Desgaste Severo', 'Daño'])
  estadoLlantasOrugas!: 'Correcto' | 'Desgaste Severo' | 'Daño';

  /** Antes no se capturaba y se guardaba siempre "Correcto": una falla de luces nunca quedaba registrada. */
  @IsIn(['Correcto', 'Falla'])
  lucesYAlarmas!: 'Correcto' | 'Falla';

  @IsIn(['Correcto', 'Falla'])
  sistemaFrenos!: 'Correcto' | 'Falla';

  @IsString()
  @MaxLength(500)
  observaciones!: string;
}
