import { IsIn } from 'class-validator';

/** Solo destinos válidos del nuevo flujo (NUEVO es el estado inicial). */
export class CambiarEstadoDto {
  @IsIn(['EN_CURSO', 'CERRADO'], { message: 'estado debe ser EN_CURSO o CERRADO' })
  estado!: 'EN_CURSO' | 'CERRADO';
}
