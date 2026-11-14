import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Agregar/quitar permisos de un rol (PK compuesta rol+permiso — sin flags).
 * Los ids que ya están asignados en "agregar" se ignoran; los de "quitar"
 * que no estén son no-op.
 */
export class PermisosRolDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(107)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  agregar?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(107)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  quitar?: string[];
}
