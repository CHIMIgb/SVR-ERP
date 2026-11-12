import { Injectable, ForbiddenException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

/**
 * Rutas accesibles mientras el usuario deba crear su PIN propio (claim rpc,
 * PR #18 #4): el resto de la API responde 403 hasta que cambie el PIN.
 * `refresh` no está aquí porque usa JwtRefreshAuthGuard (guard aparte).
 */
export const RUTAS_PERMITIDAS_SIN_PIN = [
  'auth/pin/cambio',
  'auth/pin/estado',
  'auth/logout',
  'auth/profile',
];

/** ¿El claim rpc del token bloquea esta ruta? (extraído para tests unitarios). */
export function bloqueadoPorCambioPin(
  user: { requierePinCambio?: boolean } | undefined,
  ruta: string,
): boolean {
  if (!user?.requierePinCambio) return false;
  // tolera con/sin slash inicial y con/sin el prefijo global /api
  // (req.route.path viene como "/api/auth/profile" en Nest 11 + Express 5)
  const limpia = ruta.replace(/^\/+(api\/)?/, '');
  return !RUTAS_PERMITIDAS_SIN_PIN.includes(limpia);
}

/**
 * JwtAuthGuard + enforcement server del cambio de PIN obligatorio (PR #18 #4).
 * Antes el `requiereCambio` solo lo exigía la pantalla: con el token del PIN
 * temporal se podía golpear cualquier endpoint. Ahora el claim `rpc` del
 * token bloquea todo salvo la whitelist, hasta que el PIN sea propio.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const req = context.switchToHttp().getRequest<Request>();
    // req.route.path (con o sin el prefijo /api, según versión de Express)
    const ruta = req.route?.path ?? req.originalUrl.replace(/^\/+api\//, '/');
    if (bloqueadoPorCambioPin(req.user as { requierePinCambio?: boolean }, ruta)) {
      throw new ForbiddenException(
        'Debes crear tu PIN propio antes de continuar. Cambia tu PIN primero',
      );
    }
    return true;
  }
}
