import { IsIn, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** Bytes decodificados máximos por imagen (2 MB — mismo tope del service). */
export const MAX_BYTES_DECODIFICADOS_ADJUNTO = 2 * 1024 * 1024;

/**
 * Imagen adjunta al incidente (base64; límites 2 MB y mimes de imagen).
 *
 * Review PR #17: el tamaño ya NO lo declara el cliente — el server lo
 * deriva de la longitud del base64. Al eliminar `tamano`:
 * - un "1.5" ya no revienta la columna Int con un 500,
 * - un payload inflado ya no pasa con tamano falso.
 */
export class AdjuntoDto {
  @IsString()
  @MaxLength(200)
  nombre!: string;

  @IsIn(['image/jpeg', 'image/png', 'image/webp', 'image/gif'], {
    message: 'mime debe ser image/jpeg, image/png, image/webp o image/gif',
  })
  mime!: string;

  /**
   * 2 MB decodificados = 2,792,597 chars de base64 máx; cap conservador con
   * margen de padding. La magia del fichero (firma) la valida el service.
   */
  @IsString()
  @MinLength(1)
  @MaxLength(Math.ceil((MAX_BYTES_DECODIFICADOS_ADJUNTO / 3) * 4) + 4, {
    message: 'La imagen excede el máximo de 2 MB',
  })
  @Matches(/^[A-Za-z0-9+/]+={0,2}$/, {
    message: 'datos debe contener la imagen en base64',
  })
  datos!: string;
}
