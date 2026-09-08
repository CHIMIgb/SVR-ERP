import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class ActualizarCuentaDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto?: number;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;

  /** UUID para asignar proyecto, null para desligarlo. Undefined = no tocar. */
  @IsOptional()
  @IsUUID()
  proyectoId?: string | null;
}