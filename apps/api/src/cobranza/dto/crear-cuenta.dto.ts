import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class CrearCuentaDto {
  @IsUUID()
  clienteId!: string;

  @IsOptional()
  @IsUUID()
  facturaId?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto!: number;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;
}