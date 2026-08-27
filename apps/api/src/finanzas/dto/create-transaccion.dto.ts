import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TipoTransaccion } from '@prisma/client';

/** Categorías financieras aceptadas — coincide con el catálogo del frontend. */
export const CATEGORIAS_FINANZAS = [
  'Pago de Obra',
  'Anticipo de Cliente',
  'Venta de Material',
  'Renta de Maquinaria',
  'Combustible',
  'Nómina',
  'Refacciones',
  'Mantenimiento',
  'Servicios',
  'Impuestos',
  'Otros',
] as const;

export class CreateTransaccionDto {
  @IsEnum(TipoTransaccion)
  tipo!: TipoTransaccion;

  @IsString()
  @IsIn(CATEGORIAS_FINANZAS)
  categoria!: string;

  @IsNumber()
  @Min(0.01)
  monto!: number;

  @IsDateString()
  fecha!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  descripcion!: string;
}
