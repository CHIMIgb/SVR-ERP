import {
  IsString,
  IsNumber,
  IsUUID,
  IsOptional,
  Min,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBitacoraDto {
  @IsUUID()
  maquinaId!: string;

  @IsString()
  @MaxLength(500)
  actividad!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  horas!: number;

  @IsDateString()
  fecha!: string;

  @IsString()
  @MaxLength(300)
  obraTexto!: string;

  @IsOptional()
  @IsUUID()
  obraId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  codigo?: string;
}
