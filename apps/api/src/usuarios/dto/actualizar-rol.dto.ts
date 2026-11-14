import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { CategoriaReporte } from '@prisma/client';

/** Editar un rol del catálogo. El rol `es_sistema` (Administrador) no se edita. */
export class ActualizarRolDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  descripcion?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  nivel?: number;

  @IsOptional()
  @IsEnum(CategoriaReporte)
  torre?: CategoriaReporte;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
