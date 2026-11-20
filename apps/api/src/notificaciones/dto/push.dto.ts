import { Type } from 'class-transformer';
import { IsDefined, IsString, IsUUID, Matches, MaxLength, MinLength, ValidateNested } from 'class-validator';

/** Llaves del navegador para cifrar el push (PushSubscription.keys). */
export class LlavesPushDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  p256dh!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  auth!: string;
}

/** POST /auth... /notificaciones/push-suscripcion — suscripción Web Push del dispositivo. */
export class SuscripcionPushDto {
  /** URL única que el server usa para enviar (PushSubscription.endpoint). */
  @IsString()
  @Matches(/^https:\/\/.+/, {
    message: 'endpoint debe ser una URL https del navegador',
  })
  @MaxLength(600)
  endpoint!: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => LlavesPushDto)
  llaves!: LlavesPushDto;
}

/** DELETE /notificaciones/push-suscripcion — baja por endpoint (solo la propia). */
export class BajaSuscripcionPushDto {
  @IsString()
  @Matches(/^https:\/\/.+/, {
    message: 'endpoint debe ser una URL https del navegador',
  })
  @MaxLength(600)
  endpoint!: string;
}
