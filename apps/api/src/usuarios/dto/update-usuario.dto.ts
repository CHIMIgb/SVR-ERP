import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CategoriaReporte } from '@prisma/client';

/**
 * Edición de usuario — MISMA captura que el alta (decisión del cliente,
 * 2026-11-14): persona (nombre, apellidos, teléfono), correo, contraseña
 * opcional (vacía = conservar), rol único y área.
 * El estado activo NO va aquí: es una acción propia
 * (`PATCH /usuarios/:id/estado` con su modal).
 */
export class UpdateUsuarioDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  apellidoPaterno?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  apellidoMaterno?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  email?: string;

  /** Contraseña nueva — si va vacía/ausente se conserva la actual. */
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password?: string;

  /** Cambio de rol (mono-rol: siempre es el rol único del usuario). */
  @IsOptional()
  @IsString()
  rolId?: string;

  @IsOptional()
  @IsEnum(CategoriaReporte)
  torre?: CategoriaReporte;
}
