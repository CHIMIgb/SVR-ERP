import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSION_KEY = 'require_permission';

export interface RequiredPermission {
  modulo: string;
  recurso: string;
  accion: string;
}

export const RequirePermission = (
  modulo: string,
  recurso: string,
  accion: string,
) => SetMetadata(REQUIRE_PERMISSION_KEY, { modulo, recurso, accion });
