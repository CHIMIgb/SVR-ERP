import { IsString, Matches, MinLength, MaxLength } from 'class-validator';

/** POST /auth/login-pin — número de empleado + PIN (spec §6.4-6.5). */
export class LoginPinDto {
  @IsString()
  @Matches(/^(ADM|RES|TEC|COB|TRA)-\d{1,6}$/, {
    message: 'El número de empleado debe tener el formato PREF-NNN (ej. TRA-0142)',
  })
  numeroEmpleado!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(8, { message: 'El PIN debe tener exactamente 8 caracteres' })
  pin!: string;
}

/** POST /auth/pin/cambio — PIN actual + nuevo (x2 validado en el controller/service). */
export class PinCambioDto {
  @IsString()
  @MinLength(8)
  @MaxLength(8)
  pinActual!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(8)
  pinNuevo!: string;
}

/** POST /auth/pin/reinicio — mesa de ayuda reinicia con temporal de 24 h. */
export class PinReinicioDto {
  @Matches(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, {
    message: 'userId debe ser un UUID',
  })
  userId!: string;
}

/** POST /auth/pin/desbloqueo — mesa de ayuda desbloquea la cuenta. */
export class PinDesbloqueoDto {
  @Matches(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, {
    message: 'userId debe ser un UUID',
  })
  userId!: string;
}
