import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString, IsIn, Min, MinLength } from 'class-validator';

export const ESTADOS_COBRO_BITACORA = ['Listo para Facturar', 'Facturado', 'Pendiente Firma'] as const;

export class UpdateBitacoraRentaDto {
  @IsOptional()
  @IsString()
  maquinaId?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  cliente?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  obraUbicacion?: string;

  @IsOptional()
  @IsString()
  horaInicio?: string;

  @IsOptional()
  @IsString()
  horaFin?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  horasEfectivas?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  horasExtras?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  horometroInicial?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  horometroFinal?: number;

  @IsOptional()
  @IsString()
  @MinLength(3)
  actividadRealizada?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  tarifaHoraRenta?: number;

  @IsOptional()
  @IsBoolean()
  firmado?: boolean;

  @IsOptional()
  @IsString()
  nombreResidente?: string;

  @IsOptional()
  @IsString()
  cargoResidente?: string;

  @IsOptional()
  @IsIn(ESTADOS_COBRO_BITACORA)
  estadoCobro?: (typeof ESTADOS_COBRO_BITACORA)[number];
}
