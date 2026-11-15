import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

/** Línea de detalle de una orden de compra. */
export class OrdenCompraItemInput {
  /**
   * Artículo del catálogo de inventario ya existente. Si viene, se vincula y el
   * stock se actualiza al recibir (Fase 7 T4).
   *
   * Se valida la FORMA hex-36 (Postgres/Prisma la aceptan como @db.Uuid) y NO
   * la versión/variante RFC: los datos heredados del dump incluyen IDs tipo
   * "c2000000-0000-0000-0000-000000000001" (v0/variante 0) que son legítimos
   * en la BD pero fallarían @IsUUID estándar.
   */
  @IsOptional()
  @Matches(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, {
    message: 'articuloId debe ser un UUID',
  })
  articuloId?: string;

  /**
   * Nombre del artículo. OBLIGATORIO si NO viene `articuloId` (línea de artículo
   * nuevo que se dará de alta al recibir). Ignorado si `articuloId` viene.
   */
  @ValidateIf((o) => !o.articuloId)
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  nombre?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  cantidad!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precioUnitario!: number;
}

export class CreateOrdenCompraDto {
  @IsUUID()
  proveedorId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;

  /** Ya no se captura en la UI: el monto se deriva de la suma de las líneas. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto?: number;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  /** Fecha límite de pago (B4): se propaga a la CxP que nace con la OC. Opcional. */
  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrdenCompraItemInput)
  items!: OrdenCompraItemInput[];
}
