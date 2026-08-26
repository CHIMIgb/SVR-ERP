import { IsString, IsNumber, IsOptional, IsDateString, Min, MinLength } from 'class-validator';

export class UpdateCargaCombustibleDto {
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  litros?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  horasTrabajadasPeriodo?: number;

  @IsOptional()
  @IsString()
  @MinLength(3)
  lugar?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costo?: number;

  @IsOptional()
  @IsString()
  operador?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;
}
