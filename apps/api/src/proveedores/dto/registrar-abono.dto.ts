import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

const METODOS_PAGO = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'MIXTO'] as const;

export class RegistrarAbonoDto {
  @IsUUID()
  ordenCompraId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto!: number;

  @IsOptional()
  @IsDateString()
  fechaPago?: string;

  @IsOptional()
  @IsIn(METODOS_PAGO)
  metodoPago?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  referencia?: string;
}