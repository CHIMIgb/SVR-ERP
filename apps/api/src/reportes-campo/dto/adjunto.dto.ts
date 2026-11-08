import { IsIn, IsNumber, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

/** Imagen adjunta al incidente (base64; límites 2 MB y mimes de imagen). */
export class AdjuntoDto {
  @IsString()
  @MaxLength(200)
  nombre!: string;

  @IsIn(['image/jpeg', 'image/png', 'image/webp', 'image/gif'], {
    message: 'mime debe ser image/jpeg, image/png, image/webp o image/gif',
  })
  mime!: string;

  @IsNumber()
  @Min(1)
  @Max(2 * 1024 * 1024)
  tamano!: number;

  @IsString()
  @MinLength(1)
  datos!: string;
}
