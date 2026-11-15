import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CotizacionItemDto } from './cotizacion-item.dto';

export class CreateCotizacionDto {
  @IsString()
  @MaxLength(500)
  descripcion!: string;

  @IsNumber()
  @Min(0)
  monto!: number;

  @IsDateString()
  fecha!: string;

  /** Condiciones precargadas del Word (opcional). */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  condiciones?: string;

  /**
   * Partidas (renglones). Cuando vienen, el monto de la cabecera se
   * RECALCULA como la suma de importes y el `monto` enviado se ignora.
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CotizacionItemDto)
  items?: CotizacionItemDto[];
}
