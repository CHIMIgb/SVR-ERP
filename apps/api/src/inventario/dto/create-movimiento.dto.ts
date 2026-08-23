import {
  IsString,
  IsNumber,
  IsUUID,
  IsOptional,
  Min,
  MaxLength,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMovimientoDto {
  @IsUUID()
  articuloId!: string;

  @IsString()
  @IsIn(['ENTRADA', 'SALIDA'])
  tipo!: 'ENTRADA' | 'SALIDA';

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  cantidad!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;

  @IsOptional()
  @IsString()
  referenciaTipo?: string;

  @IsOptional()
  @IsUUID()
  referenciaId?: string;
}
