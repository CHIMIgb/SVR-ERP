import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CategoriaReporte } from '@prisma/client';

/**
 * Alta de usuario de escritorio (vista /usuarios, solo Administrador).
 * La identidad PWA de trabajadores (número + PIN) vive en /trabajadores —
 * aquí el acceso es por email + contraseña.
 */
export class CreateUsuarioDto {
  /** Persona del catálogo ya existente (si no viene, se crea una con los datos del alta rápida). */
  @IsOptional()
  @IsUUID()
  personaId?: string;

  /** Alta rápida de persona (obligatoria si no viene personaId). */
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

  /** Correo de acceso a la app de escritorio (único). */
  @IsString()
  @MaxLength(200)
  email!: string;

  /** Contraseña de acceso (se guarda solo su hash bcrypt). */
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password!: string;

  /** Rol principal (roles activos, no `es_sistema`). */
  @IsUUID()
  rolId!: string;

  /** Área (torre) — precede a la del rol en /reportes. */
  @IsOptional()
  @IsEnum(CategoriaReporte)
  torre?: CategoriaReporte;
}
