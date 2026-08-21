import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nombre!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  apellido_paterno?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  apellido_materno?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  telefono?: string;
}
