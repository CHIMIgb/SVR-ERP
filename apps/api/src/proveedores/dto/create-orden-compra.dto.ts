import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateOrdenCompraDto {
  @IsUUID()
  proveedorId!: string;

  @IsString()
  @MaxLength(1000)
  descripcion!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto!: number;

  @IsOptional()
  @IsDateString()
  fecha?: string;
}