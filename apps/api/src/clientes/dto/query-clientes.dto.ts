import { IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryClientesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}
