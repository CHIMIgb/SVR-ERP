import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Flags de una vista para el rol. */
export class VistaRolItemDto {
  @IsString()
  @MaxLength(64)
  vistaId!: string;

  @IsBoolean()
  puedeVer!: boolean;

  @IsBoolean()
  puedeCrear!: boolean;

  @IsBoolean()
  puedeEditar!: boolean;

  @IsBoolean()
  puedeEliminar!: boolean;

  @IsBoolean()
  puedeExportar!: boolean;
}

/** Asignar/actualizar los flags de vistas de un rol (upsert por vista). */
export class VistasRolDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => VistaRolItemDto)
  vistas!: VistaRolItemDto[];
}
