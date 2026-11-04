import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El correo no es válido' })
  email!: string;

  // Sin mínimo de longitud en login: la política larga (min N, comunes, HIBP)
  // pertenece al registro/cambio de contraseña. Aquí solo anti-DoS (max 128).
  @IsString({ message: 'La contraseña debe ser texto' })
  @MaxLength(128, { message: 'La contraseña no puede exceder 128 caracteres' })
  password!: string;
}
