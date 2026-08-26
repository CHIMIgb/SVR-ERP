import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class ReportarIncidenteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  descripcion!: string;
}
