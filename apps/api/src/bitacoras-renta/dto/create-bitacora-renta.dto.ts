import { IsString, IsUUID, IsNumber, IsOptional, IsBoolean, IsDateString, Min, MinLength, ValidateIf } from 'class-validator';

export class CreateBitacoraRentaDto {
  @IsUUID()
  trabajadorId!: string;

  /** Código legible de la máquina (ej. "M001"). */
  @IsString()
  maquinaId!: string;

  @IsDateString()
  fecha!: string;

  @IsString()
  @MinLength(2)
  cliente!: string;

  @IsString()
  @MinLength(2)
  obraUbicacion!: string;

  /** Formato 24h "HH:mm". */
  @IsString()
  horaInicio!: string;

  @IsString()
  horaFin!: string;

  @IsNumber()
  @Min(0)
  horasEfectivas!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  horasExtras?: number;

  @IsNumber()
  @Min(0)
  horometroInicial!: number;

  @IsNumber()
  @Min(0)
  horometroFinal!: number;

  @IsString()
  @MinLength(3)
  actividadRealizada!: string;

  @IsNumber()
  @Min(0.01)
  tarifaHoraRenta!: number;

  @IsOptional()
  @IsBoolean()
  firmado?: boolean;

  @ValidateIf((o) => o.firmado === true)
  @IsString()
  @MinLength(2)
  nombreResidente?: string;

  @ValidateIf((o) => o.firmado === true)
  @IsString()
  @MinLength(2)
  cargoResidente?: string;
}
