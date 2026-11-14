import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

/** Asignar un rol al usuario (opcionalmente como principal). */
export class AsignarRolDto {
  @IsUUID()
  rolId!: string;

  @IsOptional()
  @IsBoolean()
  esPrincipal?: boolean;
}
