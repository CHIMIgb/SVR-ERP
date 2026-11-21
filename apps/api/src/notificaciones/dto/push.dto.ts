import { Type } from 'class-transformer';
import {
  IsDefined,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  ValidationArguments,
  ValidatorConstraintInterface,
} from 'class-validator';
import { esEndpointPushPermitido } from '../push-hosts';

/** Lista blanca de hosts de push (bloqueante 2 PR #23 — SSRF). */
@ValidatorConstraint({ name: 'endpointPushPermitido' })
class EndpointPushPermitido implements ValidatorConstraintInterface {
  validate(endpoint: string): boolean {
    return esEndpointPushPermitido(endpoint);
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} debe pertenecer a un servicio de push conocido (FCM, Mozilla, Windows o Apple)`;
  }
}

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
  @Validate(EndpointPushPermitido)
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
  @Validate(EndpointPushPermitido)
  @MaxLength(600)
  endpoint!: string;
}
