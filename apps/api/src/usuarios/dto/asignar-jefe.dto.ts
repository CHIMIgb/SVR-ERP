import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Asignar jefe a un usuario (vista /equipos, P11).
 * `null` des-asigna (fallback: el usuario solo ve sus propios reportes).
 * @IsString y no @IsUUID: los UUID legados del seed no pasan la validación RFC.
 */
export class AsignarJefeDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  jefeUserId!: string | null;
}
