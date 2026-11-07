import {
  IsString,
  IsIn,
  IsNumber,
  IsOptional,
  IsDateString,
  Matches,
  Max,
  MaxLength,
  MinLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CATEGORIAS_PUESTO, LicenciaDto, ContactoEmergenciaDto, MONTO_MAXIMO } from './create-trabajador.dto';
import { HORA_HHMM, TELEFONO_VALIDO, recortar } from '../../common/validacion';

export const ESTADOS_TRABAJADOR = ['Activo', 'Inactivo', 'Vacaciones'] as const;

export class UpdateTrabajadorDto {
  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombre?: string;

  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  puesto?: string;

  @IsOptional()
  @IsIn(CATEGORIAS_PUESTO)
  categoriaPuesto?: (typeof CATEGORIAS_PUESTO)[number];

  /** 'Inactivo' no se acepta aquí: la baja es POST /:id/liquidar (lo revisa el servicio). */
  @IsOptional()
  @IsIn(ESTADOS_TRABAJADOR)
  estado?: (typeof ESTADOS_TRABAJADOR)[number];

  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MinLength(7)
  @MaxLength(20)
  @Matches(TELEFONO_VALIDO, { message: 'telefono debe tener al menos 7 dígitos (solo números, espacios, guiones, paréntesis o +)' })
  telefono?: string;

  @IsOptional()
  @IsString()
  @Matches(HORA_HHMM, { message: 'entrada debe tener formato HH:mm (24 horas)' })
  entrada?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MONTO_MAXIMO)
  sueldoFiscal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MONTO_MAXIMO)
  sueldoEfectivo?: number;

  @IsOptional()
  @IsIn(['Tarjeta', 'Efectivo', 'Mixto'])
  metodoPago?: 'Tarjeta' | 'Efectivo' | 'Mixto';

  /** Nombre de un proyecto activo; '' quita la asignación. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  proyecto?: string;

  /** Código de la máquina; '' la libera. */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  maquinaId?: string;

  @IsOptional()
  @IsDateString()
  fechaContratacion?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vacacionesDias?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  horasExtraSemana?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tarifaHoraExtra?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  descuentosSemana?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  conceptoDescuento?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LicenciaDto)
  licencia?: LicenciaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactoEmergenciaDto)
  contactoEmergencia?: ContactoEmergenciaDto;
}
