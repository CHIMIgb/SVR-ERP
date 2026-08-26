import { IsIn } from 'class-validator';

export const ESTADOS_NOMINA = ['Pendiente', 'Pagado'] as const;

export class ActualizarEstadoNominaDto {
  @IsIn(ESTADOS_NOMINA)
  estado!: (typeof ESTADOS_NOMINA)[number];
}
