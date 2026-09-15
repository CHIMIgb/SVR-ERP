import { IsUUID } from 'class-validator';

export class ConciliarMovimientoDto {
  @IsUUID()
  transaccionId!: string;
}