import { IsNumber, IsOptional, Min } from 'class-validator';

export class FinanzasProyectoDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  ingresoCobrado?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  gastado?: number;
}
