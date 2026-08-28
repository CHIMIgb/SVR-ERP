import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { EstadoCotizacion } from '@prisma/client';

export class CambiarEstadoCotizacionDto {
  @IsEnum(EstadoCotizacion)
  estado!: EstadoCotizacion;

  /** Motivo (obligatorio al rechazar). Se ignora al aceptar. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivoRechazo?: string;
}
