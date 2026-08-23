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

export class UpdateBitacoraDto {
  @IsOptional()
  @IsUUID()
  maquinaId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  actividad?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  horas?: number;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  obraTexto?: string;

  @IsOptional()
  @IsUUID()
  obraId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  codigo?: string;
}
