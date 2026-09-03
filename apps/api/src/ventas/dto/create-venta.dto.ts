import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MetodoPago } from '@prisma/client';

/** Método de pago aceptado por la API (camelCase, igual al frontend). */
export type MetodoPagoInput = 'efectivo' | 'tarjeta' | 'transferencia';

/** Línea del carrito que se va a cobrar. */
export class VentaItemDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'materialId debe ser un UUID válido',
  })
  materialId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  medida!: string;

  @IsNumber()
  @Min(0.01)
  cantidad!: number;

  /** Precio por unidad capturado en el front (se valida contra el catálogo). */
  @IsNumber()
  @Min(0)
  precioUnitario!: number;
}

/** Pago de la venta (una venta mixta tiene varias líneas). */
export class VentaPagoDto {
  @IsIn(['efectivo', 'tarjeta', 'transferencia'])
  metodo!: MetodoPagoInput;

  @IsNumber()
  @Min(0.01)
  monto!: number;
}

export class CreateVentaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  cajero!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  cliente?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  terminal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  caja?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VentaItemDto)
  items!: VentaItemDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VentaPagoDto)
  pagos!: VentaPagoDto[];

  /** Método principal (para mostrar en el ticket/resumen). */
  @IsIn(['efectivo', 'tarjeta', 'transferencia'])
  metodo!: MetodoPagoInput;

  @IsOptional()
  @IsNumber()
  @Min(0)
  efectivoRecibido?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cambio?: number;

  /** IVA/IEPS no se reciben; el backend calcula sobre el total (16%). */
  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'idempotenciaKey debe ser un UUID válido',
  })
  idempotenciaKey?: string;
}

/** Mapea el método del frontend (camelCase) al enum Prisma. */
export function toMetodoPago(m: MetodoPagoInput): MetodoPago {
  switch (m) {
    case 'efectivo':
      return MetodoPago.EFECTIVO;
    case 'tarjeta':
      return MetodoPago.TARJETA;
    case 'transferencia':
      return MetodoPago.TRANSFERENCIA;
  }
}
