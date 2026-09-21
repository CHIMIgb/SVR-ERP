import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Estados permitidos por el check constraint chk_facturas_estado de la tabla facturas.
 * TIMBRADA = CFDI timbrado (equivalente a "emitida" en otras plataformas).
 */
const ESTADOS_PERMITIDOS = ['TIMBRADA', 'CANCELADA'] as const;

export class CambiarEstadoFacturaDto {
  @IsIn(ESTADOS_PERMITIDOS)
  estado!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivoCancelacion?: string;
}
