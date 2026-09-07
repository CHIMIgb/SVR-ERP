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
import { FORMAS_PAGO_FACTURA, USOS_CFDI } from './crear-factura.dto';

export class ActualizarFacturaDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  serie?: string;

  @IsOptional()
  @IsIn(FORMAS_PAGO_FACTURA)
  formaPago?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  metodoPago?: string;

  @IsOptional()
  @IsIn(USOS_CFDI)
  usoCfdi?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  moneda?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  tipoCambio?: number;

  @IsOptional()
  @IsDateString()
  periodoInicio?: string;

  @IsOptional()
  @IsDateString()
  periodoFin?: string;
}
