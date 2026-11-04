import { IsOptional, IsUUID, IsString, MaxLength } from 'class-validator';

/**
 * Asignación de responsable. Al menos uno de los dos campos debe venir:
 * - asignadoA: FK de un trabajador activo (quién lo debe resolver).
 * - asignadoNombre: texto libre (trabajador externo o aún no catalogado).
 * body vacío → ASIGNACION_VACIA (400).
 */
export class AsignarReporteDto {
  @IsOptional()
  @IsUUID('4', { message: 'El id del trabajador asignado debe ser un UUID válido' })
  asignadoA?: string | null;

  @IsOptional()
  @IsString({ message: 'El nombre del asignado debe ser texto' })
  @MaxLength(120, { message: 'El nombre del asignado no puede exceder 120 caracteres' })
  asignadoNombre?: string | null;
}
