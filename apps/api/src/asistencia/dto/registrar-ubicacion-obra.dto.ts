import { IsNumber, IsOptional, Max, Min } from 'class-validator';

/** Radio de la geocerca de una obra: de una caseta (20 m) a un frente grande (2 km, el radio por defecto). */
export const RADIO_OBRA_MINIMO_METROS = 20;
export const RADIO_OBRA_MAXIMO_METROS = 2000;

/**
 * Centro de la geocerca tomado en la obra con el GPS del teléfono (o escrito a mano) y su radio.
 * La precisión del GPS se revisa en el servicio para dar un mensaje claro si la señal es mala.
 */
export class RegistrarUbicacionObraDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @IsNumber()
  @Min(RADIO_OBRA_MINIMO_METROS)
  @Max(RADIO_OBRA_MAXIMO_METROS)
  radioPermitidoMetros!: number;

  /** Precisión que reportó el GPS del teléfono; sin ella se toma como captura manual. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  precisionGpsMetros?: number;
}
