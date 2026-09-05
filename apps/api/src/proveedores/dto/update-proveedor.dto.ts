import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { CATEGORIAS_PROVEEDOR } from './create-proveedor.dto';

export class UpdateProveedorDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{2,3}$/, {
    message: 'rfc debe ser un RFC válido (persona física o moral)',
  })
  rfc?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  correo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  telefono?: string;

  @IsOptional()
  @IsIn(CATEGORIAS_PROVEEDOR)
  categoria?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}