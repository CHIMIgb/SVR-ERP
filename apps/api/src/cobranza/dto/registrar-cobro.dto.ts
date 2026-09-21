import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export const METODOS_PAGO_COBRO = ['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE'] as const;

export class RegistrarCobroDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto!: number;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsIn(METODOS_PAGO_COBRO)
  metodoPago?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  referencia?: string;
}