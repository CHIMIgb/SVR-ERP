import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export const FORMAS_PAGO_FACTURA = ['PAGO_EN_UNA_SOLA_EXHIBICION', 'PPD'] as const;
export const USOS_CFDI = ['G03', 'G01', 'G02', 'I01', 'I02', 'I03', 'D01', 'D02', 'D03', 'D04', 'D05', 'S01', 'CP01', 'CN01'] as const;
export const OBJETOS_IMPUESTO = ['01', '02', '03', '04', '05', '06', '07', '08'] as const;

export class ConceptoFacturaDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  cantidad!: number;

  @IsString()
  @MaxLength(50)
  unidad!: string;

  @IsString()
  @MaxLength(500)
  descripcion!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  valorUnitario!: number;

  @IsOptional()
  @IsIn(OBJETOS_IMPUESTO)
  objetoImpuesto?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1)
  impuestoTasa?: number;
}

export class CrearFacturaDto {
  @IsUUID()
  clienteId!: string;

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConceptoFacturaDto)
  conceptos!: ConceptoFacturaDto[];
}
