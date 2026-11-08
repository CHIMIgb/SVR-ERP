import { IsString, MaxLength, MinLength } from 'class-validator';

/** Actividad publicada en el incidente (bitácora de trabajo). */
export class ActividadDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  texto!: string;
}
