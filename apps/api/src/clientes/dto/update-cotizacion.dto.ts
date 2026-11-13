import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CotizacionItemDto } from './cotizacion-item.dto';

/** DTO para editar una cotización (todos los campos opcionales = PATCH). */
export class UpdateCotizacionDto {
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monto?: number;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  condiciones?: string;

  /**
   * Reemplazo completo de partidas. `undefined` = no tocar; `[]` = eliminar
   * todas (vuelve a cotización plana). Con partidas, el monto se recalcula.
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CotizacionItemDto)
  items?: CotizacionItemDto[];
}
