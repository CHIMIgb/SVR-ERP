import { IsBoolean, IsOptional, IsString } from 'class-validator';

/** Asignar un rol al usuario (opcionalmente como principal). */
export class AsignarRolDto {
  /** @IsString y no @IsUUID: los UUID legados del seed no pasan la validación RFC. */
  @IsString()
  rolId!: string;

  @IsOptional()
  @IsBoolean()
  esPrincipal?: boolean;
}
