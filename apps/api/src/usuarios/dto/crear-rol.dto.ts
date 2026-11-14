import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { CategoriaReporte } from '@prisma/client';

/** Crear un rol del catálogo (vista /roles, tab Roles — solo Administrador). */
export class CrearRolDto {
  @IsString()
  @MaxLength(80)
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  descripcion?: string;

  /** Nivel jerárquico (0-100). */
  @IsOptional()
  @IsInt()
  @Min(0)
  nivel?: number;

  @IsOptional()
  @IsEnum(CategoriaReporte)
  torre?: CategoriaReporte;
}
