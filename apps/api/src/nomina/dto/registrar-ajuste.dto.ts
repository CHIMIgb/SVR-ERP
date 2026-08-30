import { IsIn, IsNumber, IsString, Min, MinLength } from 'class-validator';

export const TIPOS_AJUSTE_NOMINA = ['Bono', 'Descuento', 'Prestamo'] as const;

export class RegistrarAjusteDto {
  @IsIn(TIPOS_AJUSTE_NOMINA)
  tipo!: (typeof TIPOS_AJUSTE_NOMINA)[number];

  @IsNumber()
  @Min(0.01)
  monto!: number;

  @IsString()
  @MinLength(3)
  concepto!: string;
}
