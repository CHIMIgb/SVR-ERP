import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { EstadoCotizacion } from '@prisma/client';

const ESTADOS_PERMITIDOS: EstadoCotizacion[] = [
  EstadoCotizacion.ACEPTADA,
  EstadoCotizacion.RECHAZADA,
];

export class CambiarEstadoCotizacionDto {
  /** Solo se permite aceptar o rechazar; no se puede volver a PENDIENTE. */
  @IsIn(ESTADOS_PERMITIDOS)
  estado!: EstadoCotizacion;

  /** Motivo (obligatorio al rechazar). Se ignora al aceptar. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivoRechazo?: string;
}
