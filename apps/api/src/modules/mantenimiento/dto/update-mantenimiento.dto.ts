import { IsString, IsIn, IsNumber, IsOptional, IsDateString, Min, MinLength } from 'class-validator';

export class UpdateMantenimientoDto {
  @IsOptional()
  @IsString()
  maquinaId?: string;

  @IsOptional()
  @IsIn(['Correctivo', 'Preventivo'])
  tipo?: 'Correctivo' | 'Preventivo';

  @IsOptional()
  @IsString()
  @MinLength(3)
  descripcion?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  horasServicio?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costo?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  proximoServicioHoras?: number;
}
