import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class QueryMovimientosDto {
  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === '1')
  @IsBoolean()
  soloNoConciliados?: boolean;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : value))
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : value))
  @IsNumber()
  @Min(1)
  limit?: number;
}