import { IsString, MaxLength } from 'class-validator';

/**
 * Cambio de rol único (mono-rol, decisión del cliente 2026-11-14):
 * el usuario SIEMPRE tiene un solo rol — este endpoint lo reemplaza.
 * @IsString y no @IsUUID: los UUID legados del seed no pasan la validación RFC.
 */
export class CambiarRolDto {
  @IsString()
  @MaxLength(64)
  rolId!: string;
}
