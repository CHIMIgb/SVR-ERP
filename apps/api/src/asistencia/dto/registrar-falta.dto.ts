import { IsUUID, IsOptional, IsDateString, IsString, MaxLength } from 'class-validator';

export class RegistrarFaltaDto {
  @IsUUID()
  trabajadorId!: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notas?: string;
}
