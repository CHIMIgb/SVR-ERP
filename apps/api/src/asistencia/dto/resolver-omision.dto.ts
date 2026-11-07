import { IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { recortar } from '../../common/validacion';

/** La administradora valida la justificación y elige en qué queda la omisión (decisión del cliente). */
export const RESOLUCIONES_OMISION = ['Falta', 'Retardo'] as const;
export type ResolucionOmision = (typeof RESOLUCIONES_OMISION)[number];

export class ResolverOmisionDto {
  @IsIn(RESOLUCIONES_OMISION)
  resolucion!: ResolucionOmision;

  /** Por qué faltó o llegó tarde el trabajador, según lo justificó. */
  @Transform(recortar)
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  motivo!: string;
}

/** Para quien no checó nada ese día: se crea el registro ya resuelto. */
export class ResolverOmisionSinMarcajeDto extends ResolverOmisionDto {
  @IsUUID()
  trabajadorId!: string;

  /** Día de la omisión ("YYYY-MM-DD"); por defecto, hoy. No puede ser futuro. */
  @IsOptional()
  @IsDateString()
  fecha?: string;
}
