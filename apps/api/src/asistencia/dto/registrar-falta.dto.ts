import { IsUUID, IsOptional, IsDateString, IsString } from 'class-validator';

export class RegistrarFaltaDto {
  @IsUUID()
  trabajadorId!: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  notas?: string;
}
