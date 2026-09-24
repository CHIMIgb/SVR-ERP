import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * Datos de un artículo que se dará de ALTA en inventario al recibir la OC.
 * Aplica a líneas cuya `articuloId` es nulo (artículo nuevo): además del
 * `nombre` ya capturado en la línea, en la recepción se eligen la categoría y
 * la unidad de medida del catálogo.
 */
export class ArticuloNuevoRecepcion {
  /** Índice 0-based de la línea dentro de `CreateOrdenCompraDto.items`. */
  @IsInt()
  @Min(0)
  lineaIndex!: number;

  @IsUUID()
  categoriaId!: string;

  @IsUUID()
  unidadId!: string;
}

export class RecibirOrdenCompraDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ArticuloNuevoRecepcion)
  nuevosArticulos?: ArticuloNuevoRecepcion[];
}
