import { IsNotEmpty, IsString } from 'class-validator';

export class CargarLoteDto {
  /** CSV mínimo: `fecha,descripcion,deposito,retiro` (header opcional, separador `;` o `,`). */
  @IsString()
  @IsNotEmpty()
  csv!: string;
}