import { IsBoolean } from 'class-validator';

/** Activar / desactivar cuenta (acción propia del botón de estado). */
export class EstadoUsuarioDto {
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  activo!: boolean;
}
