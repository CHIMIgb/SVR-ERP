import {
  IsDateString,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCotizacionDto {
  @IsString()
  @MaxLength(500)
  descripcion!: string;

  @IsNumber()
  @Min(0)
  monto!: number;

  @IsDateString()
  fecha!: string;
}
