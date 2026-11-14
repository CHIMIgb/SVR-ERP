import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CategoriaReporte } from '@prisma/client';

/** Edición de usuario de escritorio (email, estado, área). La contraseña NO se
 * edita aquí — el usuario la cambia por su propio flujo. */
export class UpdateUsuarioDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  email?: string;

  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser verdadero o falso' })
  activo?: boolean;

  @IsOptional()
  @IsEnum(CategoriaReporte)
  torre?: CategoriaReporte;
}
