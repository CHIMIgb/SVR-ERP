import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateClienteDto {
  @IsString()
  @MaxLength(150)
  nombre!: string;

  /** Opcional: clientes sin empresa (persona física / alta rápida del POS). */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  empresa?: string;

  @IsEmail()
  @MaxLength(200)
  correo!: string;

  @IsString()
  @MaxLength(50)
  telefono!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  rfc?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
