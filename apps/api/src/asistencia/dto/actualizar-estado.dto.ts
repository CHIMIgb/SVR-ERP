import { IsIn } from 'class-validator';

export const ESTADOS_ASISTENCIA_EDITABLES = ['Puntual', 'Retardo', 'Falta', 'Justificado'] as const;

export class ActualizarEstadoDto {
  @IsIn(ESTADOS_ASISTENCIA_EDITABLES)
  estado!: (typeof ESTADOS_ASISTENCIA_EDITABLES)[number];
}
